const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pqxlkushbmlxjnlbjtbu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxeGxrdXNoYm1seGpubGJqdGJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYzNTEyNCwiZXhwIjoyMDkwMjExMTI0fQ.M81nKf34Py9kHSMKonABnrImMW7wnDKOvlLcYZTAznk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: profiles, error: err2 } = await supabase.from('profiles').select('id, email, role, is_active');
  console.log("Profiles DB:", profiles);
}

check();
