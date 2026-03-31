import { redirect } from 'next/navigation'

// /login (no portal specified) → default to student portal
// This handles any old links pointing to /login
export default function LoginRedirect() {
  redirect('/login/student')
}
