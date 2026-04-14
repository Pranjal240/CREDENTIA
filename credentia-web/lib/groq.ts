import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  timeout: 25000, // 25s timeout — must finish before Vercel's function timeout
})

function parseGroqJSON(content: string) {
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

    console.error('Groq JSON Parse Error. Raw content:', content)
    throw new Error('Failed to parse Groq response as JSON.')
  }
}

function buildMessages(systemPrompt: string, content: string, isImage: boolean = false): any[] {
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
 * Call Gemini as a fallback when Groq is rate-limited.
 * Uses the REST API directly — no SDK needed.
 */
async function callGemini(systemPrompt: string, content: string, isImage: boolean, maxTokens: number): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const model = 'gemini-2.0-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  // Build parts for the request
  const parts: any[] = [
    { text: systemPrompt + '\n\nAnalyze the following and return ONLY a valid JSON object:' }
  ]

  if (isImage && content.startsWith('data:')) {
    // Extract base64 data and mime type
    const match = content.match(/^data:([^;]+);base64,(.+)$/)
    if (match) {
      parts.push({
        inline_data: {
          mime_type: match[1],
          data: match[2].substring(0, 2_000_000) // Cap at ~1.5MB for safety
        }
      })
    } else {
      parts.push({ text: content.substring(0, 8000) })
    }
  } else {
    parts.push({ text: content.substring(0, 8000) })
  }

  const body = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: maxTokens,
      responseMimeType: 'application/json',
    }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Gemini API error ${res.status}: ${errText.substring(0, 200)}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  return parseGroqJSON(text)
}

async function callGroq(systemPrompt: string, content: string, isImage: boolean, maxTokens: number = 2000) {
  // Use fast model for text, vision model for images
  const model = isImage ? 'meta-llama/llama-4-scout-17b-16e-instruct' : 'llama-3.3-70b-versatile'

  // CRITICAL: meta-llama/llama-4-scout-17b-16e-instruct does NOT support response_format json_object
  // Only apply it for the text model
  const requestParams: any = {
    model,
    messages: buildMessages(systemPrompt, content, isImage),
    temperature: 0.1,
    max_tokens: maxTokens,
  }

  if (!isImage) {
    requestParams.response_format = { type: 'json_object' }
  }

  // Try Groq first, fall back to Gemini on rate limit (429) or transient errors
  try {
    const result = await groq.chat.completions.create(requestParams)
    return parseGroqJSON(result.choices[0].message.content || '')
  } catch (err: any) {
    const isRateLimit = err.status === 429 || err.message?.includes('429') || err.message?.includes('rate')
    const isServerError = err.status >= 500
    const isTimeout = err.message?.includes('timeout') || err.message?.includes('ETIMEDOUT')

    console.error(`Groq API error (model=${model}, status=${err.status}):`, err.message || err)

    // If Gemini fallback is available, use it for rate-limit and server errors
    if ((isRateLimit || isServerError || isTimeout) && process.env.GEMINI_API_KEY) {
      console.log('[AI] Groq rate-limited/failed, falling back to Gemini...')
      try {
        return await callGemini(systemPrompt, content, isImage, maxTokens)
      } catch (geminiErr: any) {
        console.error('[AI] Gemini fallback also failed:', geminiErr.message)
        // Fall through to throw the original Groq error
      }
    }

    // If rate limited with no fallback, wait and retry once
    if (isRateLimit && !process.env.GEMINI_API_KEY) {
      console.log('[AI] Rate limited, waiting 3s and retrying Groq...')
      await new Promise(r => setTimeout(r, 3000))
      try {
        const retryResult = await groq.chat.completions.create(requestParams)
        return parseGroqJSON(retryResult.choices[0].message.content || '')
      } catch (retryErr: any) {
        console.error('[AI] Groq retry also failed:', retryErr.message)
      }
    }

    throw new Error(`AI analysis timed out or failed: ${err.message || 'unknown error'}`)
  }
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

  return callGroq(systemPrompt, content, isImage, 2000)
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

  return callGroq(systemPrompt, content, isImage, 2000)
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

  return callGroq(systemPrompt, content, isImage, 2000)
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

  return callGroq(systemPrompt, content, isImage, 2000)
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

  return callGroq(systemPrompt, content, isImage, 2000)
}
