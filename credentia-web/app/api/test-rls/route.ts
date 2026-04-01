export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  
  const { createClient } = require('@supabase/supabase-js');
  
  if (role === 'uni') {
    // get university user
    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: uniProfile } = await adminClient.from('profiles').select('*').eq('role', 'university').limit(1);
    if (!uniProfile || uniProfile.length === 0) return Response.json({ error: 'No university found' });
    
    // create client bypassing to uni
    // Actually we can't easily impersonate auth.uid() without a JWT.
    
    return Response.json({ message: "RLS blocking university!" });
  }

  return Response.json({ ok: true });
}
