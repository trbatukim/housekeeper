'use client'
import { useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { addMeal } from './actions'
import styles from '../../theme.module.css'
import { AMOUNT_TYPES, CUSTOM_AMOUNT_TYPE } from '@/lib/amountTypes'
import { NAME_MAX_LENGTH } from '@/lib/textLimits'

type IngredientRow = {
  name: string
  amount: string
  amountType: string
  customAmountType: string
}

const EMPTY_INGREDIENT: IngredientRow = {
  name: '',
  amount: '',
  amountType: AMOUNT_TYPES[0],
  customAmountType: '',
}

export default function AddMealItem({
  householdId,
  primaryColor,
}: {
  householdId: string
  primaryColor: string
}) {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [ingredients, setIngredients] = useState<IngredientRow[]>([])

  const close = () => setClosing(true)

  const addIngredient = () => setIngredients((prev) => [...prev, EMPTY_INGREDIENT])

  const removeIngredient = (index: number) =>
    setIngredients((prev) => prev.filter((_, i) => i !== index))

  const updateIngredient = (index: number, patch: Partial<IngredientRow>) =>
    setIngredients((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))

  const handleSubmit = () => {
    close()
    setIngredients([])
  }

  return (
    <>
      <button type="button" className={styles.button} onClick={() => setOpen(true)}>
        Add a meal
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
              <h2 className={styles.modalTitle}>Add Meal</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={close}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <form action={addMeal} onSubmit={handleSubmit} className={styles.modalForm}>
              <input type="hidden" name="householdId" value={householdId} />
              <input
                type="text"
                name="name"
                placeholder="Meal name"
                required
                maxLength={NAME_MAX_LENGTH}
                className={styles.input}
              />
              <div className={styles.ingredientList}>
                {ingredients.map((ingredient, index) => {
                  const isCustom = ingredient.amountType === CUSTOM_AMOUNT_TYPE

                  return (
                    <div key={index} className={styles.ingredientRow}>
                      <input
                        type="text"
                        name="ingredientName"
                        value={ingredient.name}
                        onChange={(e) => updateIngredient(index, { name: e.target.value })}
                        placeholder="Ingredient"
                        required
                        maxLength={NAME_MAX_LENGTH}
                        className={`${styles.input} ${styles.ingredientName}`}
                      />
                      <input
                        type="number"
                        step="0.01"
                        name="ingredientAmount"
                        value={ingredient.amount}
                        onChange={(e) => updateIngredient(index, { amount: e.target.value })}
                        placeholder="Amount"
                        required
                        className={styles.input}
                      />
                      <select
                        value={ingredient.amountType}
                        onChange={(e) => updateIngredient(index, { amountType: e.target.value })}
                        className={styles.select}
                      >
                        {AMOUNT_TYPES.map((amountType) => (
                          <option key={amountType} value={amountType}>{amountType}</option>
                        ))}
                        <option value={CUSTOM_AMOUNT_TYPE}>Other...</option>
                      </select>
                      {isCustom && (
                        <input
                          type="text"
                          value={ingredient.customAmountType}
                          onChange={(e) => updateIngredient(index, { customAmountType: e.target.value })}
                          placeholder="Custom unit"
                          required
                          maxLength={NAME_MAX_LENGTH}
                          className={`${styles.input} ${styles.ingredientCustomUnit}`}
                        />
                      )}
                      <button
                        type="button"
                        className={`${styles.modalClose} ${styles.ingredientRemove}`}
                        onClick={() => removeIngredient(index)}
                        aria-label="Remove ingredient"
                      >
                        &times;
                      </button>
                      <input
                        type="hidden"
                        name="ingredientAmountType"
                        value={isCustom ? ingredient.customAmountType : ingredient.amountType}
                      />
                    </div>
                  )
                })}
                <button type="button" className={styles.button} onClick={addIngredient}>
                  + Add ingredient
                </button>
              </div>
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
