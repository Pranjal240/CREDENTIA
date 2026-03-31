const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pqxlkushbmlxjnlbjtbu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxeGxrdXNoYm1seGpubGJqdGJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYzNTEyNCwiZXhwIjoyMDkwMjExMTI0fQ.M81nKf34Py9kHSMKonABnrImMW7wnDKOvlLcYZTAznk'
);

async function clean() {
  console.log("Fetching all users...");
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error(error);
    return;
  }
  
  console.log(`Found ${users.users.length} users. Deleting them all...`);
  for (const user of users.users) {
    await supabase.auth.admin.deleteUser(user.id);
  }
  console.log("All users deleted.");

  console.log("Wiping admin_whitelist...");
  await supabase.from('admin_whitelist').delete().neq('email', 'not-a-real-address');
  
  console.log("Adding pranjalmsihra2409@gmail.com and praanjalmishra2409@gmail.com to whitelist...");
  await supabase.from('admin_whitelist').insert([
    { email: 'pranjalmsihra2409@gmail.com' },
    { email: 'praanjalmishra2409@gmail.com' },
  ]);
  
  console.log("Done database cleanup!");
}

clean();
