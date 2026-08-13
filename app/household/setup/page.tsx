import { createHousehold, joinHousehold } from './actions'
import styles from './setup.module.css'
import Link from 'next/link'

export default async function HouseholdSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Set Up Your Household</h1>
      <Link href="/" className={styles.backButton}>&larr; Back</Link>


      <section className={styles.contentBox}>
        <section className={styles.formSection}>
          <h2>Create new household</h2>
          <form className={styles.form} action={createHousehold}>
            <input type="text" name="name" placeholder="Household name" className={styles.input} required />
            <button type="submit" className={styles.button}>Create</button>
          </form>
        </section>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <section className={styles.formSection}>
          <h2>Join existing household</h2>
          <form className={styles.form} action={joinHousehold}>
            <input type="text" name="householdId" placeholder="Household ID" className={styles.input} required />
            <button type="submit" className={styles.button}>Join</button>
          </form>
        </section>
      </section>

      {params.error && <p className={styles.error}>{params.error}</p>}
    </div>
  )
}