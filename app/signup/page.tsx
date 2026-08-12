'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import styles from '../login/login.module.css'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })
    setMessage(error ? error.message : 'Check your email to confirm your account.')
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.logo}>HouseKeeper</h1>
      <form onSubmit={handleSignup} className={styles.form}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className={styles.input} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className={styles.input} />
        <button type="submit" className={styles.button}>
          Sign up
        </button>
        {message && <p className={styles.error}>{message}</p>}
      </form>
    </div>
  )
}