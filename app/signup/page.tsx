import { signup } from './actions'
import styles from '../login/login.module.css'
import Link from 'next/link'
import type { Metadata } from "next";
import { NAME_MAX_LENGTH } from '@/lib/textLimits'

export const metadata: Metadata = {
  title: "Sign Up"
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const params = await searchParams

  return (
    <div className="container">
      <h1 className="logo">HouseKeeper</h1>
      <form action={signup} className={styles.loginForm}>
        <input type="text" name="name" placeholder='Name' required maxLength={NAME_MAX_LENGTH} className='input'></input>
        <input type="email" name="email" placeholder="Email" required className="input" />
        <input type="password" name="password" placeholder="Password" required className="input" />
        <button type="submit" className={styles.loginButton}>Sign up</button>
        <Link href="/login" className={styles.linkText}>Login instead</Link>
        {params.error && <p className="error">{params.error}</p>}
        {params.message && <p>{params.message}</p>}
      </form>
    </div>
  )
}
