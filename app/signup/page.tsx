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
    <div className="container">
      <h1 className={styles.logo}>HouseKeeper</h1>
      <form onSubmit={handleSignup} className={styles.loginForm}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="input" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="input" />
        <button type="submit" className={styles.loginButton}>
          Sign up
        </button>
        {message && <p className="error">{message}</p>}
      </form>
    </div>
  )
}