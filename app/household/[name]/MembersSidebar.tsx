'use client'
import { useState } from 'react'
import styles from './theme.module.css'

export default function MembersSidebar({
  members,
}: {
  members: { id: string; name: string }[]
}) {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)

  const close = () => setClosing(true)

  return (
    <>
      <button
        type="button"
        className={styles.membersToggle}
        onClick={() => setOpen(true)}
        aria-label="Show household members"
      >
        Members
      </button>
      {(open || closing) && (
        <div className={styles.membersOverlay} onClick={close}>
          <aside
            className={
              closing
                ? `${styles.membersPanel} ${styles.membersPanelClosing}`
                : styles.membersPanel
            }
            onClick={(e) => e.stopPropagation()}
            onAnimationEnd={() => {
              if (closing) {
                setOpen(false)
                setClosing(false)
              }
            }}
          >
            <div className={styles.membersHeader}>
              <h2 className={styles.membersTitle}>Members</h2>
              <button
                type="button"
                className={styles.membersClose}
                onClick={close}
                aria-label="Close members list"
              >
                &times;
              </button>
            </div>
            {members.length === 0 ? (
              <p className={styles.note}>No members yet.</p>
            ) : (
              <ul className={styles.membersList}>
                {members.map((member) => (
                  <li key={member.id} className={styles.membersItem}>
                    {member.name}
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      )}
    </>
  )
}
