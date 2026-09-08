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
        className={`${styles.button} ${styles.itemButton}`}
        onClick={() => setOpen(true)}
      >
        Edit
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
