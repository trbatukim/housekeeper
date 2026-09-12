'use client'
import { useState } from 'react'
import { addIngredientsToGroceries, deleteMeal } from './actions'
import MealFormModal from './MealFormModal'
import styles from '../../theme.module.css'

type Ingredient = {
  id: string
  name: string
  amount: number | null
  amount_type: string | null
}

export default function MealItem({
  meal,
  householdId,
  primaryColor,
  savedIngredients,
}: {
  meal: { id: string; name: string; ingredients: Ingredient[] }
  householdId: string
  primaryColor: string
  savedIngredients: Ingredient[]
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <li className={styles.item}>
      <button
        type="button"
        className={styles.mealToggle}
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
      >
        <svg
          className={styles.mealChevron}
          data-open={expanded}
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 8 L12 17 L20 8" />
        </svg>
        {meal.name}
      </button>
      <div className={styles.itemActions}>
        <MealFormModal
          householdId={householdId}
          primaryColor={primaryColor}
          savedIngredients={savedIngredients}
          meal={meal}
        />
        <form action={deleteMeal}>
          <input type="hidden" name="householdId" value={householdId} />
          <input type="hidden" name="mealId" value={meal.id} />
          <button type="submit" className="negativeButton">Delete</button>
        </form>
      </div>
      {expanded && (
        <div className={styles.mealDetails}>
          {meal.ingredients.length > 0 ? (
            <form action={addIngredientsToGroceries} className={styles.mealDetailsForm}>
              <input type="hidden" name="householdId" value={householdId} />
              <ul className={styles.ingredientChecklist}>
                {meal.ingredients.map((ingredient) => (
                  <li key={ingredient.id}>
                    <label className={styles.ingredientCheck}>
                      <input
                        type="checkbox"
                        name="ingredientId"
                        value={ingredient.id}
                        defaultChecked
                        autoComplete="off"
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      <span>
                        {ingredient.name}
                        {ingredient.amount != null && ingredient.amount_type &&
                          ` (${ingredient.amount} ${ingredient.amount_type})`}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <button type="submit" className={styles.button}>
                Add checked to groceries
              </button>
            </form>
          ) : (
            <p className={styles.mealEmpty}>No ingredients.</p>
          )}
        </div>
      )}
    </li>
  )
}
