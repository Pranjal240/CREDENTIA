// lib/groq.ts — All Groq AI analysis functions
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

// ═══ RESUME ANALYSIS ═══
export async function analyzeResume(resumeContent: string) {
  const result = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You are an expert ATS resume analyzer for the Indian job market.
        Analyze and return ONLY this exact JSON (no other text):
        {
          "ats_score": <number 0-100>,
          "authenticity_score": <number 0-100>,
          "found_keywords": <string array, max 15 items>,
          "missing_keywords": <string array, max 10 items>,
          "feedback": "<2-3 sentences of actionable feedback>",
          "verified": <true if score > 60, else false>,
          "issues": <string array of specific issues found>
        }`,
      },
      {
        role: 'user',
        content: `Analyze this resume:\n\n${resumeContent.substring(0, 8000)}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 1500,
  })
  return JSON.parse(result.choices[0].message.content || '{}')
}

// ═══ POLICE CERTIFICATE ANALYSIS ═══
export async function analyzePoliceDocument(documentContent: string) {
  const result = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You are an expert Indian police verification certificate analyzer.
        Analyze and return ONLY this exact JSON:
        {
          "is_police_certificate": <boolean>,
          "confidence": <number 0-100>,
          "certificate_number": "<string or null>",
          "issue_date": "<DD/MM/YYYY or null>",
          "valid_until": "<DD/MM/YYYY or null>",
          "issuing_authority": "<string or null>",
          "police_station": "<string or null>",
          "district": "<string or null>",
          "state": "<string or null>",
          "applicant_name": "<string or null>",
          "verification_status": "<VERIFIED|NEEDS_REVIEW|INVALID>",
          "fraud_indicators": <list any suspicious elements>,
          "issues": <list of problems found>
        }
        If document doesn't look like a police certificate: is_police_certificate=false, confidence<40.
        IMPORTANT: This is AI pre-screening only. Human admin will make final decision.`,
      },
      {
        role: 'user',
        content: `Analyze this police verification document:\n\n${documentContent.substring(0, 6000)}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 1000,
  })
  return JSON.parse(result.choices[0].message.content || '{}')
}

// ═══ AADHAAR ANALYSIS ═══
export async function analyzeAadhaar(documentContent: string) {
  const result = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You are a secure Aadhaar card data extractor. CRITICAL SECURITY RULES:
        1. NEVER extract or return full Aadhaar number (12 digits)
        2. ONLY return last 4 digits masked as XXXX-XXXX-[last4]
        3. Only extract non-sensitive publicly visible data
        
        Return ONLY this exact JSON:
        {
          "verified": <boolean>,
          "name": "<string or null>",
          "dob": "<DD/MM/YYYY or null>",
          "gender": "<Male|Female|Other or null>",
          "state": "<state name or null>",
          "district": "<string or null>",
          "pincode": "<string or null>",
          "aadhaar_last4": "<4 digits or null>",
          "is_masked_aadhaar": <boolean>,
          "confidence": <number 0-100>,
          "issues": <list of issues>
        }`,
      },
      {
        role: 'user',
        content: `Extract from this Aadhaar document:\n\n${documentContent}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  })
  return JSON.parse(result.choices[0].message.content || '{}')
}

// ═══ DEGREE ANALYSIS ═══
export async function analyzeDegree(documentContent: string) {
  const result = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You are a degree certificate verifier.
        Return ONLY this JSON:
        {
          "verified": <boolean>,
          "confidence": <number 0-100>,
          "university_name": "<string or null>",
          "degree": "<string, e.g. B.Tech, MBA>",
          "course": "<string, e.g. Computer Science>",
          "year_of_passing": "<year or null>",
          "grade_cgpa": "<string or null>",
          "roll_number": "<string or null>",
          "issues": <list>
        }`,
      },
      { role: 'user', content: documentContent },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  })
  return JSON.parse(result.choices[0].message.content || '{}')
}
