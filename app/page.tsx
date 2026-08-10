import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div>
      <p>Logged in as {user.email}</p>
      <Link href="/household/setup">Create or Join a Household</Link> <br></br>
      <Link href="/household">View Current Households</Link>
    </div>
  )
}