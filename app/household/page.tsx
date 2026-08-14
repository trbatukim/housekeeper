import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import styles from './household.module.css'
import LeaveHouseholdButton from './LeaveHouseholdButton'

export default async function Households() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('./login')
  }

  const { data: memberships, error } = await supabase
    .from('profiles_to_households')
    .select('households(id, name)')
    .eq('profile_id', user.id)

  if (error) {
    return (
      <div className="container">
        <Link href="/" className="backButton">&larr; Back</Link>
        <p className="error">Failed to load households: {error.message}</p>
      </div>
    )
  }

  const households = memberships.flatMap((m) => m.households)

  return (
    <div className="container">
      <Link href="/" className="backButton">&larr; Back</Link>
      <h1 className="title">Your Households</h1>
      <div className={`contentBox ${styles.listBox}`}>
        {households.length === 0 ? (
          <p className={styles.empty}>You haven&apos;t joined any households yet.</p>
        ) : (
          <ul className={styles.list}>
            {households.map((household) => (
              <li key={household.id} className={styles.item}>
                <Link
                  href={`/household/${encodeURIComponent(household.name)}`}
                  className={`link ${styles.linkGrow}`}
                >
                  {household.name}
                </Link>
                <LeaveHouseholdButton
                  householdId={household.id}
                  householdName={household.name}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}