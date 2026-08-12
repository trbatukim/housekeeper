import { login } from './actions'
import styles from './login.module.css'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className={styles.container}>
      <h1 className={styles.logo}>HouseKeeper</h1>
      <form action={login} className={styles.form}>
        <input type="email" name="email" placeholder="Email" required className={styles.input} />
        <input type="password" name="password" placeholder="Password" required className={styles.input} />
        <button type="submit" className={styles.button}>Log in</button>
        {params.error && <p className={styles.error}>{params.error}</p>}
      </form>
    </div>
  )
}