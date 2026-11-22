import { GEMINI_MODELS, GROQ_TEXT_MODEL, GROQ_VISION_MODEL, groqExtras } from '@/lib/ai-config'

function parseAIJSON(content: string) {
  // First try direct parse
  try {
    return JSON.parse(content || '{}')
  } catch {
    // Strip markdown code fences if the model wrapped the JSON in them
    const cleaned = (content || '{}')
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim()

    // Try to extract a JSON object from surrounding text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch {}
    }

    console.error('AI JSON parse error. Raw content:', content)
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
          { type: 'image_url', image_url: { url: content } },
        ],
      },
    ]
  }
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Analyze:\n\n${content.substring(0, 8000)}` },
  ]
}

/**
 * PRIMARY PROVIDER: Google Gemini.
 *
 * Gemini is the primary provider because it reads PDFs and images natively,
 * returns structured JSON through responseMimeType, and has the rate limits to
 * handle many students uploading at once. Models are listed in lib/ai-config.ts
 * and tried in order, so a retired model falls through to the next one.
 */
async function callGemini(systemPrompt: string, content: string, isImage: boolean, maxTokens: number): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  // Build user parts for the request
  const userParts: any[] = []

  if (isImage && content.startsWith('data:')) {
    // Extract base64 data and mime type from the data URL
    const match = content.match(/^data:([^;]+);base64,(.+)$/)
    if (match) {
      userParts.push({
        inline_data: {
          mime_type: match[1],
          data: match[2].substring(0, 4_000_000), // inline data is limited to about 4MB
        },
      })
      userParts.push({
        text: 'Analyze this document thoroughly. Extract ALL information visible in the document. Return ONLY a valid JSON object matching the schema in the system instructions. No markdown, no explanation, just the JSON.',
      })
    } else {
      userParts.push({ text: content.substring(0, 15000) })
    }
  } else {
    userParts.push({
      text: `Analyze the following document and extract all information. Return ONLY a valid JSON object matching the schema in the system instructions.\n\n${content.substring(0, 15000)}`,
    })
  }

  let lastError = 'Gemini is unavailable'

  for (const model of GEMINI_MODELS) {
    // Extraction needs little reasoning, so the lowest thinking level keeps it fast.
    // A model that rejects the setting is asked again without it.
    for (const withThinking of [true, false]) {
      const generationConfig: Record<string, unknown> = {
        temperature: 0.1,
        maxOutputTokens: maxTokens,
        responseMimeType: 'application/json',
      }
      if (withThinking) generationConfig.thinkingConfig = { thinkingLevel: 'minimal' }

      const body = {
        // systemInstruction gives stronger prompt adherence than putting it in contents
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: userParts }],
        generationConfig,
        // Keep Gemini from blocking document images such as Aadhaar cards and certificates
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }

      console.log(`[Gemini] Calling ${model} (isImage=${isImage}, contentLen=${content.length}, thinking=${withThinking})`)

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(45000), // vision can be slow
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        lastError = `Gemini ${model} returned ${res.status}: ${errText.substring(0, 200)}`
        if (res.status === 400 && withThinking && /thinking/i.test(errText)) continue
        // Retired, busy or failing model: move on to the next one.
        if (res.status === 404 || res.status === 429 || res.status >= 500) break
        throw new Error(lastError)
      }

      const data = await res.json()

      if (data.candidates?.[0]?.finishReason === 'SAFETY') {
        console.warn('[Gemini] Response blocked by the safety filter')
        throw new Error('Gemini safety filter blocked the response')
      }

      const text = data.candidates?.[0]?.content?.parts?.find((part: any) => typeof part.text === 'string' && !part.thought)?.text || ''
      if (!text.trim()) {
        lastError = `Gemini ${model} returned an empty response`
        break
      }

      console.log(`[Gemini] ${model} success, response length: ${text.length}`)
      return parseAIJSON(text)
    }
  }

  throw new Error(lastError)
}

/**
 * FALLBACK PROVIDER: Groq.
 *
 * Only used when Gemini is unavailable or fails. Groq has no image model at the
 * moment, so it can back up documents that arrive as text but not scanned images.
 */
async function callGroqDirect(systemPrompt: string, content: string, isImage: boolean, maxTokens: number = 2000) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY not configured')
  if (isImage && !GROQ_VISION_MODEL) throw new Error('The backup provider cannot read images')

  const model = isImage ? GROQ_VISION_MODEL : GROQ_TEXT_MODEL

  const requestParams: Record<string, unknown> = {
    model,
    messages: buildGroqMessages(systemPrompt, content, isImage),
    temperature: 0.1,
    // Reasoning models count their thinking against this limit.
    max_tokens: maxTokens + 1000,
    ...groqExtras(model),
  }

  // Image models do not accept response_format json_object.
  if (!isImage) {
    requestParams.response_format = { type: 'json_object' }
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(requestParams),
    signal: AbortSignal.timeout(25000),
  })

  if (!res.ok) {
    const error: any = new Error(`Groq ${model} returned ${res.status}`)
    error.status = res.status
    throw error
  }

  const data = await res.json()
  return parseAIJSON(data.choices?.[0]?.message?.content || '')
}

/**
 * Unified AI caller: Gemini first, Groq as the backup.
 *
 * 1. If GEMINI_API_KEY exists, call Gemini first.
 * 2. If Gemini fails, fall back to Groq.
 * 3. If there is no GEMINI_API_KEY, call Groq directly, retrying once on a rate limit.
 */
export async function callAI(systemPrompt: string, content: string, isImage: boolean, maxTokens: number = 2000) {
  const hasGemini = !!process.env.GEMINI_API_KEY
  const hasGroq = !!process.env.GROQ_API_KEY

  // STRATEGY 1: Gemini primary, Groq fallback
  if (hasGemini) {
    try {
      return await callGemini(systemPrompt, content, isImage, maxTokens)
    } catch (geminiErr: any) {
      console.error(`[AI] Gemini primary failed: ${geminiErr.message}`)

      if (hasGroq) {
        console.log('[AI] Falling back to Groq...')
        try {
          return await callGroqDirect(systemPrompt, content, isImage, maxTokens)
        } catch (groqErr: any) {
          console.error(`[AI] Groq fallback also failed: ${groqErr.message}`)
          throw new Error(`AI analysis failed (both providers down). Gemini: ${geminiErr.message}. Groq: ${groqErr.message}`)
        }
      }

      throw new Error(`AI analysis failed: ${geminiErr.message}`)
    }
  }

  // STRATEGY 2: Groq only (no Gemini key)
  if (hasGroq) {
    try {
      return await callGroqDirect(systemPrompt, content, isImage, maxTokens)
    } catch (err: any) {
      const isRateLimit = err.status === 429 || err.message?.includes('429') || err.message?.includes('rate')

      // Retry once on a rate limit after a short delay
      if (isRateLimit) {
        console.log('[AI] Groq rate limited, retrying in 3s...')
        await new Promise((r) => setTimeout(r, 3000))
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
- Set "verified" to TRUE if the document appears to be ANY kind of school marksheet, report card, board certificate, or academic result document. Be generous: if it has student names, subjects, marks, or grades, it is likely a valid marksheet.
- Set "verified" to FALSE ONLY if the document is clearly NOT an academic document at all (e.g. a random photo, invoice, or completely unrelated document).
- Set "confidence" to at least 70 for most genuine-looking marksheets, even if the image is slightly blurry or you cannot extract all fields.
- Extract whatever information you CAN see. Leave fields as null if unclear. Do NOT reduce confidence just because some fields are missing.

You MUST return ONLY a valid JSON object with NO additional text, NO markdown, NO code fences. The JSON schema:
{
  "verified": <boolean: true for ANY school/board academic document>,
  "confidence": <0-100, be generous: 70+ for real marksheets>,
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
