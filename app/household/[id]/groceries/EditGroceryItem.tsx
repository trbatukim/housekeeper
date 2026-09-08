'use client'
import { useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { editGroceryItem } from './actions'
import AmountTypeField from './AmountTypeField'
import styles from '../theme.module.css'
import { NAME_MAX_LENGTH } from '@/lib/textLimits'

export default function EditGroceryItem({
  item,
  householdId,
  primaryColor,
}: {
  item: { id: string; name: string; amount: number | null; amount_type: string | null }
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
              <h2 className={styles.modalTitle}>Edit Item</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={close}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <form action={editGroceryItem} onSubmit={close} className={styles.modalForm}>
              <input type="hidden" name="householdId" value={householdId} />
              <input type="hidden" name="itemId" value={item.id} />
              <input
                type="text"
                name="name"
                defaultValue={item.name}
                placeholder="Item name"
                required
                maxLength={NAME_MAX_LENGTH}
                className={styles.input}
              />
              <input
                type="number"
                step="0.01"
                name="amount"
                defaultValue={item.amount ?? undefined}
                placeholder="Amount"
                required
                className={styles.input}
              />
              <AmountTypeField defaultAmountType={item.amount_type ?? 'g'} />
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
