import { signup } from './actions'
import styles from '../login/login.module.css'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const params = await searchParams

  return (
    <div className="container">
      <h1 className={styles.logo}>HouseKeeper</h1>
      <form action={signup} className={styles.loginForm}>
        <input type="email" name="email" placeholder="Email" required className="input" />
        <input type="password" name="password" placeholder="Password" required className="input" />
        <button type="submit" className={styles.loginButton}>Sign up</button>
        {params.error && <p className="error">{params.error}</p>}
        {params.message && <p>{params.message}</p>}
      </form>
    </div>
  )
}
