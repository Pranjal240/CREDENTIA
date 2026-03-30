import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: Request) {
  try {
    const { students } = await req.json()
    
    if (!students || !Array.isArray(students)) {
      return NextResponse.json({ error: 'Invalid students data' }, { status: 400 })
    }

    // Shrink data to save tokens
    const compactData = students.map(s => ({
      c: s.course,
      y: s.graduation_year,
      cgpa: s.cgpa || 0,
      ats: s.ats_score || 0,
      deg: s.degree_verified,
      pol: s.police_verified
    }))

    const systemPrompt = `You are a higher-education data analyst. Based on this cohort data of ${compactData.length} students (c=course, y=year, cgpa, ats, deg=degree verified, pol=police verified), write a short, punchy 3-paragraph executive summary highlighting:
1. Overall academic strength & readiness (ATS vs CGPA correlation)
2. Verification completeness & compliance gaps
3. Top trending courses & employability outlook

Format the output in beautiful markdown. Keep it under 250 words. Do not make up individual student names. Talk about the cohort collectively as "Your institution's talent pool" or "The cohort". Use bullet points for key metrics.`

    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(compactData) }
      ],
      temperature: 0.3,
      max_tokens: 600,
    })

    return NextResponse.json({ insights: result.choices[0].message.content })

  } catch (error: any) {
    console.error('AI Insights Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate insights' }, { status: 500 })
  }
}
