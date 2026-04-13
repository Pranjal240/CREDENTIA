const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data } = await supabase.from('profiles').select('id, email, full_name, role, is_active');
  console.log('PROFILES:', JSON.stringify(data, null, 2));
  const { data: c } = await supabase.from('companies').select('*');
  console.log('COMPANIES:', JSON.stringify(c, null, 2));
  const { data: s } = await supabase.from('students').select('*');
  console.log('STUDENTS:', JSON.stringify(s, null, 2));
})();
