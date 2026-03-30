import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

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

async function callGroq(systemPrompt: string, content: string, isImage: boolean, maxTokens: number = 2000) {
  const model = isImage ? 'llama-3.2-90b-vision-preview' : 'llama-3.3-70b-versatile'

  // CRITICAL: llama-3.2-90b-vision-preview does NOT support response_format json_object
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

  const result = await groq.chat.completions.create(requestParams)
  return parseGroqJSON(result.choices[0].message.content || '')
}

export async function analyzeResume(content: string, isImage: boolean = false) {
  const systemPrompt = `You are an expert ATS resume analyzer for Indian job market. You MUST return ONLY a valid JSON object with NO additional text, NO markdown, NO code fences. The JSON schema:
{
  "ats_score": <0-100>,
  "authenticity_score": <0-100>,
  "keywords_found": ["skill1","skill2"],
  "keywords_missing": ["missing1","missing2"],
  "strengths": ["strength1","strength2","strength3"],
  "improvements": ["tip1","tip2","tip3"],
  "experience_years": <number or null>,
  "education_level": "<string>",
  "top_skills": ["skill1","skill2","skill3","skill4","skill5"],
  "summary": "<2-3 sentence assessment>"
}`

  return callGroq(systemPrompt, content, isImage, 4000)
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
