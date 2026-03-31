const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pqxlkushbmlxjnlbjtbu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxeGxrdXNoYm1seGpubGJqdGJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYzNTEyNCwiZXhwIjoyMDkwMjExMTI0fQ.M81nKf34Py9kHSMKonABnrImMW7wnDKOvlLcYZTAznk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: users, error: err1 } = await supabase.auth.admin.listUsers();
  console.log("Auth Users:", users?.users.map(u => ({ email: u.email, id: u.id })));

  const { data: profiles, error: err2 } = await supabase.from('profiles').select('id, email, role');
  console.log("Profiles DB:", profiles);
  if (err2) console.error("Profile error:", err2);
}

check();
