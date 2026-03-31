const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pqxlkushbmlxjnlbjtbu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxeGxrdXNoYm1seGpubGJqdGJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYzNTEyNCwiZXhwIjoyMDkwMjExMTI0fQ.M81nKf34Py9kHSMKonABnrImMW7wnDKOvlLcYZTAznk'
);

async function check() {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error(error);
  } else {
    console.log("Current users in auth db: ", users.users.map(u => u.email));
  }
}
check();
