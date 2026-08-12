'use client'
import { leaveHousehold } from './actions'
import styles from './household.module.css'

export default function LeaveHouseholdButton({
  householdId,
  householdName,
}: {
  householdId: string
  householdName: string
}) {
  return (
    <form
      action={leaveHousehold}
      onSubmit={(e) => {
        if (!confirm(`Leave "${householdName}"?`)) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="householdId" value={householdId} />
      <button type="submit" className={styles.leaveButton}>
        Leave
      </button>
    </form>
  )
}
