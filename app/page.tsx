import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import styles from './homepage.module.css'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/welcome')
  }

  return (
    <div className="container">
      <h1 className="title">Home</h1>
      <div className="contentBox">
        <p className={styles.userEmail}>Logged in as {user.email}</p>
        <div className={styles.actions}>
          <Link href="/household/setup" className="link">Create or Join a Household</Link>
          <Link href="/household" className="link">View Current Households</Link>
        </div>
      </div>
    </div>
  )
}