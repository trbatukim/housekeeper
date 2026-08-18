import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from './actions'
import Link from 'next/link'
import styles from './homepage.module.css'
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home"
}

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/welcome')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  return (
    <div className="container">
      <h1 className="title">Home</h1>
      <div className="contentBox">
        <p className={styles.userEmail}>Logged in as {profile?.name}</p>
        <div className={styles.actions}>
          <Link href="/household/setup" className="link">Create or Join a Household</Link>
          <Link href="/household" className="link">View Current Households</Link>
        </div>
        <form action={signOut}>
          <button className="negativeButton" type="submit">Sign Out</button>
        </form>
      </div>
    </div>
  )
}