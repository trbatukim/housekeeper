import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div>
      <p>Logged in as {user.email}</p>
      <a href="/household/setup">Create or Join a Household</a> <br></br>
      <a href="/household">View Current Households</a>
    </div>
  )
}