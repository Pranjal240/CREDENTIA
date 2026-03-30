import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function analyzeResume(content: string) {
  const result = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You are an expert ATS resume analyzer for Indian job market. Return ONLY valid JSON:
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
      },
      { role: 'user', content: `Analyze:\n\n${content.substring(0, 8000)}` }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 4000,
  })
  return JSON.parse(result.choices[0].message.content || '{}')
}

export async function analyzePoliceDoc(content: string) {
  const result = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You are an Indian police certificate verifier. Return ONLY valid JSON:
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
      },
      { role: 'user', content: `Analyze:\n\n${content.substring(0, 6000)}` }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 1000,
  })
  return JSON.parse(result.choices[0].message.content || '{}')
}

export async function analyzeAadhaar(content: string) {
  const result = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You are a secure Aadhaar extractor. NEVER return full 12-digit number. Return ONLY JSON:
        {
          "verified": <boolean>,
          "name": "<string or null>",
          "dob": "<DD/MM/YYYY or null>",
          "gender": "<Male|Female|Other or null>",
          "state": "<string or null>",
          "aadhaar_last4": "<4 digits or null>",
          "confidence": <0-100>,
          "issues": []
        }`
      },
      { role: 'user', content: `Extract from:\n\n${content}` }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  })
  return JSON.parse(result.choices[0].message.content || '{}')
}

export async function analyzeDegree(content: string) {
  const result = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You are a degree certificate verifier. Return ONLY JSON:
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
      },
      { role: 'user', content: content }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  })
  return JSON.parse(result.choices[0].message.content || '{}')
}
