import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: Request) {
  try {
    const { jobDescription, students } = await req.json()
    
    if (!students || !Array.isArray(students) || !jobDescription) {
      return NextResponse.json({ error: 'Missing JD or student data' }, { status: 400 })
    }

    // Shrink data to save tokens but retain identity 'id'
    const candidates = students.map(s => ({
      id: s.id,
      course: s.course,
      branch: s.branch,
      skills: s.skills || '',
      cgpa: s.cgpa || 0,
      ats: s.ats_score || 0,
      year: s.graduation_year,
      v_deg: s.degree_verified,
      v_pol: s.police_verified
    }))

    const systemPrompt = `You are an elite AI Recruiter Matchmaker. 
    Analyze the provided Job Description ("user query") and find the top candidates from the JSON list provided.
    
    RETURN ONLY A VALID JSON OBJECT containing an array named "matches".
    Format:
    {
      "matches": [
        { "id": "uuid-here", "match_score": 95, "reason": "1-sentence punchy reason why they are a great fit." }
      ]
    }
    Sort the "matches" array from highest match_score to lowest. Return a maximum of 5 matches.`

    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Job Description:\n${jobDescription}\n\nCandidates:\n${JSON.stringify(candidates)}` }
      ],
      temperature: 0.1,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    })

    const resultText = result.choices[0].message.content || '{"matches":[]}'
    const data = JSON.parse(resultText)

    return NextResponse.json(data)

  } catch (error: any) {
    console.error('AI Match Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to match' }, { status: 500 })
  }
}
