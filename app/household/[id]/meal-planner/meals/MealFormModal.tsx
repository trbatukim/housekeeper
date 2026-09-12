'use client'
import { useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { addMeal, editMeal } from './actions'
import styles from '../../theme.module.css'
import { AMOUNT_TYPES, CUSTOM_AMOUNT_TYPE } from '@/lib/amountTypes'
import { NAME_MAX_LENGTH } from '@/lib/textLimits'

type IngredientRow = {
  name: string
  amount: string
  amountType: string
  customAmountType: string
}

type SavedIngredient = {
  id: string
  name: string
  amount: number | null
  amount_type: string | null
}

const EMPTY_INGREDIENT: IngredientRow = {
  name: '',
  amount: '',
  amountType: AMOUNT_TYPES[0],
  customAmountType: '',
}

const toIngredientRow = (ingredient: SavedIngredient): IngredientRow => {
  const unit = ingredient.amount_type ?? ''
  const isCustomUnit = unit !== '' && !AMOUNT_TYPES.includes(unit)

  return {
    name: ingredient.name,
    amount: ingredient.amount?.toString() ?? '',
    amountType: isCustomUnit ? CUSTOM_AMOUNT_TYPE : (unit || AMOUNT_TYPES[0]),
    customAmountType: isCustomUnit ? unit : '',
  }
}

export default function MealFormModal({
  householdId,
  primaryColor,
  savedIngredients,
  meal,
}: {
  householdId: string
  primaryColor: string
  savedIngredients: SavedIngredient[]
  meal?: { id: string; name: string; ingredients: SavedIngredient[] }
}) {
  const initialIngredients = meal ? meal.ingredients.map(toIngredientRow) : []

  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [ingredients, setIngredients] = useState<IngredientRow[]>(initialIngredients)

  const close = () => setClosing(true)

  const openModal = () => {
    setIngredients(initialIngredients)
    setOpen(true)
  }

  const addIngredient = () => setIngredients((prev) => [...prev, EMPTY_INGREDIENT])

  const addSavedIngredient = (ingredientId: string) => {
    const saved = savedIngredients.find((ingredient) => ingredient.id === ingredientId)

    if (!saved) {
      return
    }

    setIngredients((prev) => [...prev, toIngredientRow(saved)])
  }

  const removeIngredient = (index: number) =>
    setIngredients((prev) => prev.filter((_, i) => i !== index))

  const updateIngredient = (index: number, patch: Partial<IngredientRow>) =>
    setIngredients((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))

  const handleSubmit = () => {
    close()

    if (!meal) {
      setIngredients([])
    }
  }

  return (
    <>
      {meal ? (
        <button
          type="button"
          className={`${styles.button} ${styles.iconButton}`}
          onClick={openModal}
          aria-label="Edit meal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 122.88 121.51" fill="currentColor"><path d="M28.66,1.64H58.88L44.46,16.71H28.66a13.52,13.52,0,0,0-9.59,4l0,0a13.52,13.52,0,0,0-4,9.59v76.14H91.21a13.5,13.5,0,0,0,9.59-4l0,0a13.5,13.5,0,0,0,4-9.59V77.3l15.07-15.74V92.85a28.6,28.6,0,0,1-8.41,20.22l0,.05a28.58,28.58,0,0,1-20.2,8.39H11.5a11.47,11.47,0,0,1-8.1-3.37l0,0A11.52,11.52,0,0,1,0,110V30.3A28.58,28.58,0,0,1,8.41,10.09L8.46,10a28.58,28.58,0,0,1,20.2-8.4ZM73,76.47l-29.42,6,4.25-31.31L73,76.47ZM57.13,41.68,96.3.91A2.74,2.74,0,0,1,99.69.38l22.48,21.76a2.39,2.39,0,0,1-.19,3.57L82.28,67,57.13,41.68Z"/></svg>
        </button>
      ) : (
        <button type="button" className={styles.button} onClick={openModal}>
          Add a meal
        </button>
      )}
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
              <h2 className={styles.modalTitle}>{meal ? 'Edit Meal' : 'Add Meal'}</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={close}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <form action={meal ? editMeal : addMeal} onSubmit={handleSubmit} className={styles.modalForm}>
              <input type="hidden" name="householdId" value={householdId} />
              {meal && <input type="hidden" name="mealId" value={meal.id} />}
              <input
                type="text"
                name="name"
                defaultValue={meal?.name}
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
                <div className={styles.ingredientActions}>
                  {savedIngredients.length > 0 && (
                    <select
                      value=""
                      onChange={(e) => addSavedIngredient(e.target.value)}
                      className={styles.select}
                      aria-label="Add a saved ingredient"
                    >
                      <option value="" disabled>Saved ingredient...</option>
                      {savedIngredients.map((ingredient) => (
                        <option key={ingredient.id} value={ingredient.id}>
                          {ingredient.name}
                          {ingredient.amount != null && ingredient.amount_type &&
                            ` (${ingredient.amount} ${ingredient.amount_type})`}
                        </option>
                      ))}
                    </select>
                  )}
                  <button type="button" className={styles.button} onClick={addIngredient}>
                    + Add ingredient
                  </button>
                </div>
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
