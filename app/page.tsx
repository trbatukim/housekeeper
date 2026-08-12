import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import styles from './homepage.module.css'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Home</h1>
      <div className={styles.contentBox}>
        <p className={styles.userEmail}>Logged in as {user.email}</p>
        <div className={styles.actions}>
          <Link href="/household/setup" className={styles.link}>Create or Join a Household</Link>
          <Link href="/household" className={styles.link}>View Current Households</Link>
        </div>
      </div>
    </div>
  )
}