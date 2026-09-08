'use client'
import { useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { editExpenseItem } from './actions'
import styles from '../theme.module.css'
import { TEXT_MAX_LENGTH } from '@/lib/textLimits'

export default function EditExpenseItem({
  expense,
  householdId,
  primaryColor,
}: {
  expense: {
    id: string
    description: string
    amount: number
    currency: string
    category: string
    paid_on: string
  }
  householdId: string
  primaryColor: string
}) {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)

  const close = () => setClosing(true)

  return (
    <>
      <button
        type="button"
        className={`${styles.button} ${styles.iconButton}`}
        onClick={() => setOpen(true)}
        aria-label="Edit expense"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 122.88 121.51" fill="currentColor"><path d="M28.66,1.64H58.88L44.46,16.71H28.66a13.52,13.52,0,0,0-9.59,4l0,0a13.52,13.52,0,0,0-4,9.59v76.14H91.21a13.5,13.5,0,0,0,9.59-4l0,0a13.5,13.5,0,0,0,4-9.59V77.3l15.07-15.74V92.85a28.6,28.6,0,0,1-8.41,20.22l0,.05a28.58,28.58,0,0,1-20.2,8.39H11.5a11.47,11.47,0,0,1-8.1-3.37l0,0A11.52,11.52,0,0,1,0,110V30.3A28.58,28.58,0,0,1,8.41,10.09L8.46,10a28.58,28.58,0,0,1,20.2-8.4ZM73,76.47l-29.42,6,4.25-31.31L73,76.47ZM57.13,41.68,96.3.91A2.74,2.74,0,0,1,99.69.38l22.48,21.76a2.39,2.39,0,0,1-.19,3.57L82.28,67,57.13,41.68Z"/></svg>
      </button>
      {(open || closing) && createPortal(
        <div
          className={styles.modalOverlay}
          style={{ '--primary': primaryColor } as CSSProperties}
          onClick={close}
        >
          <div
            className={
              closing
                ? `${styles.modalPanel} ${styles.modalPanelClosing}`
                : styles.modalPanel
            }
            onClick={(e) => e.stopPropagation()}
            onAnimationEnd={() => {
              if (closing) {
                setOpen(false)
                setClosing(false)
              }
            }}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Edit Expense</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={close}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <form action={editExpenseItem} onSubmit={close} className={styles.modalForm}>
              <input type="hidden" name="householdId" value={householdId} />
              <input type="hidden" name="expenseId" value={expense.id} />
              <input
                type="text"
                name="description"
                defaultValue={expense.description}
                placeholder="Description"
                required
                maxLength={TEXT_MAX_LENGTH}
                className={styles.input}
              />
              <input
                type="number"
                step="0.01"
                name="amount"
                defaultValue={expense.amount}
                placeholder="Price"
                required
                className={styles.input}
              />
              <select name="currency" defaultValue={expense.currency} className={styles.select}>
                <option value="euro">Euro €</option>
                <option value="dollar">Dollar $</option>
                <option value="tl">Turkish Lira ₺</option>
                <option value="pound">Pound £</option>
              </select>
              <select name="category" defaultValue={expense.category} className={styles.select}>
                <option value="one-time">One-time</option>
                <option value="recurring">Recurring</option>
              </select>
              <input
                type="date"
                name="paidOn"
                defaultValue={expense.paid_on}
                className={styles.input}
              />
              <div className={styles.modalActions}>
                <button type="button" className={styles.button} onClick={close}>
                  Cancel
                </button>
                <button type="submit" className={styles.button}>
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
