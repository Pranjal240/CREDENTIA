export const dynamic = 'force-dynamic';

export async function GET() {
  const { createClient } = require('@supabase/supabase-js');
  const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: students } = await supa.from('students').select('id, ats_score, verifications(id, type, status, ai_result)');
  
  return Response.json({
    timestamp: Date.now(),
    students
  });
}
