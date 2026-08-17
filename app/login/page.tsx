import { login } from './actions'
import styles from './login.module.css'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="container">
      <h1 className={styles.logo}>HouseKeeper</h1>
      <form action={login} className={styles.loginForm}>
        <input type="email" name="email" placeholder="Email" required className="input" />
        <input type="password" name="password" placeholder="Password" required className="input" />
        <button type="submit" className={styles.loginButton}>Log in</button>
        <Link href="/signup" className={styles.linkText}>Sign up instead</Link>
        {params.error && <p className="error">{params.error}</p>}
      </form>
    </div>
  )
}