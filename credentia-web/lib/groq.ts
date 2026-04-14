import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  timeout: 20000, // 20s timeout
})

function parseAIJSON(content: string) {
  // First try direct parse
  try {
    return JSON.parse(content || '{}')
  } catch {
    // Strip markdown code fences if model wrapped JSON in them
    let cleaned = (content || '{}')
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim()

    // Try to extract JSON object from surrounding text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch {}
    }

    console.error('AI JSON Parse Error. Raw content:', content)
    throw new Error('Failed to parse AI response as JSON.')
  }
}

function buildGroqMessages(systemPrompt: string, content: string, isImage: boolean = false): any[] {
  if (isImage) {
    return [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Analyze this document image. Extract all information and return ONLY a valid JSON object as specified in the system prompt. No markdown, no explanation, just the JSON object.' },
          { type: 'image_url', image_url: { url: content } }
        ]
      }
    ]
  }
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Analyze:\n\n${content.substring(0, 8000)}` }
  ]
}

/**
 * PRIMARY PROVIDER: Google Gemini (gemini-2.0-flash)
 * 
 * Gemini is the primary provider because:
 * - Much higher rate limits than Groq free tier (1500 RPD vs ~30 RPM)
 * - Native vision support for PDFs and images
 * - Structured JSON output via responseMimeType
 * - Handles concurrent requests without rate limiting issues
 */
async function callGemini(systemPrompt: string, content: string, isImage: boolean, maxTokens: number): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const model = 'gemini-2.0-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  // Build user parts for the request
  const userParts: any[] = []

  if (isImage && content.startsWith('data:')) {
    // Extract base64 data and mime type from data URL
    const match = content.match(/^data:([^;]+);base64,(.+)$/)
    if (match) {
      const mimeType = match[1]
      const base64Data = match[2]

      // Add the document/image first
      userParts.push({
        inline_data: {
          mime_type: mimeType,
          data: base64Data.substring(0, 4_000_000) // Gemini supports up to ~4MB inline
        }
      })

      // Then add the instruction text
      userParts.push({
        text: 'Analyze this document thoroughly. Extract ALL information visible in the document. Return ONLY a valid JSON object matching the schema in the system instructions. No markdown, no explanation, just the JSON.'
      })
    } else {
      userParts.push({ text: content.substring(0, 15000) })
    }
  } else {
    // Text content — send more text (Gemini handles longer context than Groq)
    userParts.push({
      text: `Analyze the following document and extract all information. Return ONLY a valid JSON object matching the schema in the system instructions.\n\n${content.substring(0, 15000)}`
    })
  }

  const body = {
    // systemInstruction gives Gemini stronger prompt adherence than putting it in contents
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: [{
      role: 'user',
      parts: userParts
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: maxTokens,
      responseMimeType: 'application/json',
    },
    // Prevent Gemini from blocking document images (Aadhaar, certificates, etc.)
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ]
  }

  console.log(`[Gemini] Calling ${model} (isImage=${isImage}, contentLen=${content.length})`)

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45000), // 45s timeout — Gemini vision can be slower
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Gemini API error ${res.status}: ${errText.substring(0, 300)}`)
  }

  const data = await res.json()

  // Check for blocked content
  if (data.candidates?.[0]?.finishReason === 'SAFETY') {
    console.warn('[Gemini] Response blocked by safety filter')
    throw new Error('Gemini safety filter blocked the response')
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  if (!text.trim()) {
    throw new Error('Gemini returned empty response')
  }

  console.log(`[Gemini] Success — response length: ${text.length}`)
  return parseAIJSON(text)
}

/**
 * FALLBACK PROVIDER: Groq (llama models)
 * 
 * Only used when Gemini is unavailable or fails.
 */
async function callGroqDirect(systemPrompt: string, content: string, isImage: boolean, maxTokens: number = 2000) {
  const model = isImage ? 'meta-llama/llama-4-scout-17b-16e-instruct' : 'llama-3.3-70b-versatile'

  const requestParams: any = {
    model,
    messages: buildGroqMessages(systemPrompt, content, isImage),
    temperature: 0.1,
    max_tokens: maxTokens,
  }

  // meta-llama/llama-4-scout-17b-16e-instruct does NOT support response_format json_object
  if (!isImage) {
    requestParams.response_format = { type: 'json_object' }
  }

  const result = await groq.chat.completions.create(requestParams)
  return parseAIJSON(result.choices[0].message.content || '')
}

/**
 * Unified AI caller — Gemini-first architecture with Groq fallback.
 * 
 * This eliminates the rate-limiting bottleneck that caused "Server is busy"
 * errors when multiple students uploaded documents simultaneously.
 * 
 * Flow:
 * 1. If GEMINI_API_KEY exists → call Gemini first (primary)
 * 2. If Gemini fails → fall back to Groq
 * 3. If no GEMINI_API_KEY → call Groq directly (with retry on 429)
 */
async function callAI(systemPrompt: string, content: string, isImage: boolean, maxTokens: number = 2000) {
  const hasGemini = !!process.env.GEMINI_API_KEY
  const hasGroq = !!process.env.GROQ_API_KEY

  // ── STRATEGY 1: Gemini primary, Groq fallback ──
  if (hasGemini) {
    try {
      return await callGemini(systemPrompt, content, isImage, maxTokens)
    } catch (geminiErr: any) {
      console.error(`[AI] Gemini primary failed: ${geminiErr.message}`)

      // If Groq is also configured, try it as fallback
      if (hasGroq) {
        console.log('[AI] Falling back to Groq...')
        try {
          return await callGroqDirect(systemPrompt, content, isImage, maxTokens)
        } catch (groqErr: any) {
          console.error(`[AI] Groq fallback also failed: ${groqErr.message}`)
          // Both failed — throw the more informative error
          throw new Error(`AI analysis failed (both providers down). Gemini: ${geminiErr.message}. Groq: ${groqErr.message}`)
        }
      }

      // No Groq fallback — just throw the Gemini error
      throw new Error(`AI analysis failed: ${geminiErr.message}`)
    }
  }

  // ── STRATEGY 2: Groq only (no Gemini key) ──
  if (hasGroq) {
    try {
      return await callGroqDirect(systemPrompt, content, isImage, maxTokens)
    } catch (err: any) {
      const isRateLimit = err.status === 429 || err.message?.includes('429') || err.message?.includes('rate')

      // Retry once on rate limit with a short delay
      if (isRateLimit) {
        console.log('[AI] Groq rate limited, retrying in 3s...')
        await new Promise(r => setTimeout(r, 3000))
        try {
          return await callGroqDirect(systemPrompt, content, isImage, maxTokens)
        } catch (retryErr: any) {
          console.error('[AI] Groq retry also failed:', retryErr.message)
        }
      }

      throw new Error(`AI analysis failed: ${err.message || 'unknown error'}`)
    }
  }

  throw new Error('No AI provider configured. Set GEMINI_API_KEY or GROQ_API_KEY.')
}

export async function analyzeResume(content: string, isImage: boolean = false) {
  const systemPrompt = `You are an expert ATS resume analyzer for Indian job market. You MUST return ONLY a valid JSON object with NO additional text, NO markdown, NO code fences. Extract as much personal information as possible from the resume. The JSON schema:
{
  "ats_score": <0-100>,
  "authenticity_score": <0-100>,
  "student_name": "<full name from resume or null>",
  "phone_number": "<phone number or null>",
  "city": "<city from resume or null>",
  "state": "<state from resume or null>",
  "course": "<degree program e.g. B.Tech, MBA, BCA or null>",
  "branch": "<specialization e.g. Computer Science, Mechanical or null>",
  "cgpa": "<CGPA/GPA value as string if mentioned anywhere in resume, e.g. '7.54', '8.2' or null>",
  "graduation_year": <graduation year as number or null>,
  "keywords_found": ["skill1","skill2"],
  "keywords_missing": ["missing1","missing2"],
  "strengths": ["strength1","strength2","strength3"],
  "improvements": ["tip1","tip2","tip3"],
  "experience_years": <number or null>,
  "education_level": "<string>",
  "top_skills": ["skill1","skill2","skill3","skill4","skill5"],
  "summary": "<2-3 sentence assessment>"
}`

  return callAI(systemPrompt, content, isImage, 2000)
}

export async function analyzePoliceDoc(content: string, isImage: boolean = false) {
  const systemPrompt = `You are an Indian police certificate verifier. You MUST return ONLY a valid JSON object with NO additional text, NO markdown, NO code fences. The JSON schema:
{
  "is_police_certificate": <boolean>,
  "confidence": <0-100>,
  "certificate_number": "<string or null>",
  "issue_date": "<DD/MM/YYYY or null>",
  "issuing_authority": "<string or null>",
  "district": "<string or null>",
  "state": "<string or null>",
  "applicant_name": "<string or null>",
  "status": "<VERIFIED|NEEDS_REVIEW|INVALID>",
  "fraud_indicators": [],
  "issues": []
}`

  return callAI(systemPrompt, content, isImage, 2000)
}

export async function analyzeAadhaar(content: string, isImage: boolean = false) {
  const systemPrompt = `You are a secure Aadhaar card extractor. NEVER return the full 12-digit Aadhaar number. You MUST return ONLY a valid JSON object with NO additional text, NO markdown, NO code fences. The JSON schema:
{
  "verified": <boolean>,
  "name": "<string or null>",
  "dob": "<DD/MM/YYYY or null>",
  "gender": "<Male|Female|Other or null>",
  "state": "<string or null>",
  "aadhaar_last4": "<last 4 digits or null>",
  "confidence": <0-100>,
  "issues": []
}`

  return callAI(systemPrompt, content, isImage, 2000)
}

export async function analyzeDegree(content: string, isImage: boolean = false) {
  const systemPrompt = `You are a degree certificate verifier. You MUST return ONLY a valid JSON object with NO additional text, NO markdown, NO code fences. The JSON schema:
{
  "verified": <boolean>,
  "confidence": <0-100>,
  "university_name": "<string or null>",
  "degree": "<B.Tech|MBA|etc>",
  "course": "<subject>",
  "year_of_passing": "<year>",
  "grade_cgpa": "<string or null>",
  "roll_number": "<string or null>",
  "issues": []
}`

  return callAI(systemPrompt, content, isImage, 2000)
}

export async function analyzeMarksheet(content: string, isImage: boolean = false, marksheetType: '10th' | '12th' = '10th') {
  const grade = marksheetType === '10th' ? '10th (Secondary / SSC / SSLC / Matric)' : '12th (Higher Secondary / HSC / Intermediate / +2)'
  const systemPrompt = `You are a lenient Indian school marksheet verifier for ${grade} board certificates.

IMPORTANT RULES:
- Set "verified" to TRUE if the document appears to be ANY kind of school marksheet, report card, board certificate, or academic result document. Be generous — if it has student names, subjects, marks, or grades, it is likely a valid marksheet.
- Set "verified" to FALSE ONLY if the document is clearly NOT an academic document at all (e.g. a random photo, invoice, or completely unrelated document).
- Set "confidence" to at least 70 for most genuine-looking marksheets, even if the image is slightly blurry or you cannot extract all fields.
- Extract whatever information you CAN see. Leave fields as null if unclear — do NOT reduce confidence just because some fields are missing.

You MUST return ONLY a valid JSON object with NO additional text, NO markdown, NO code fences. The JSON schema:
{
  "verified": <boolean — true for ANY school/board academic document>,
  "confidence": <0-100, be generous — 70+ for real marksheets>,
  "student_name": "<string or null>",
  "board_name": "<e.g. CBSE, ICSE, Maharashtra Board, UP Board, etc. or null>",
  "school_name": "<string or null>",
  "roll_number": "<string or null>",
  "year_of_passing": "<year as string or null>",
  "percentage": "<percentage as string e.g. '85.4%' or null>",
  "grade": "<grade/division if shown e.g. A+, First Division or null>",
  "subjects": [{"name": "<subject>", "marks": "<marks obtained>", "max_marks": "<maximum>"}],
  "total_marks": "<string or null>",
  "result": "<PASS|FAIL|null>",
  "issues": []
}`

  return callAI(systemPrompt, content, isImage, 2000)
}
