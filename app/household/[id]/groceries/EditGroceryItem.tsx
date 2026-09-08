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
        className={`${styles.button} ${styles.iconButton}`}
        onClick={() => setOpen(true)}
        aria-label="Edit item"
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
