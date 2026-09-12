import styles from '../../theme.module.css'
import type { Metadata } from "next";
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import HouseholdThemeSync from '../../../../HouseholdThemeSync'
import { deleteMeal } from './actions'
import AddMealItem from './AddMealItem'

const DEFAULT_COLOR = '#a98bff'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: household } = await supabase
    .from('households')
    .select('name')
    .eq('id', id)
    .maybeSingle()

  return {
    title: `Meals - ${household?.name ?? 'Household'}`,
  }
}

export default async function Meals({
    params,
    searchParams,
}:{
    params: Promise<{ id: string }>
    searchParams: Promise<{ error?: string }>
}) {
    const { id } = await params
    const { error: errorMessage } = await searchParams

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: household } = await supabase
        .from('households')
        .select('id, name, primary_color')
        .eq('id', id)
        .maybeSingle()

    if (!household) {
        notFound()
    }

    const { data: meals } = await supabase
        .from('meals')
        .select('id, name, meal_to_ingredient(...ingredients(id, name, amount, amount_type))')
        .eq('household_id', household.id)
        .order('created_at')

    const primaryColor = household.primary_color ?? DEFAULT_COLOR

    return (
        <div className={styles.page} style={{ '--primary': primaryColor } as CSSProperties}>
            <HouseholdThemeSync color={primaryColor} />
            <Link href={`/household/${household.id}/meal-planner`} className={styles.themedBackButton}>&larr; Back</Link>
            <h1 className={styles.pageTitle}>Meals</h1>

            {errorMessage && <p className="error">{errorMessage}</p>}

            <div className={styles.card}>
                <AddMealItem householdId={household.id} primaryColor={primaryColor} />

                {meals && meals.length > 0 ? (
                    <ul className={styles.list}>
                        {meals.map((meal) => (
                            <li key={meal.id} className={styles.item}>
                                <span>
                                    {meal.name}
                                    {meal.meal_to_ingredient.length > 0 && (
                                        <span className={styles.ingredientSummary}>
                                            {meal.meal_to_ingredient
                                                .map((ingredient) => `${ingredient.name} (${ingredient.amount} ${ingredient.amount_type})`)
                                                .join(', ')}
                                        </span>
                                    )}
                                </span>
                                <form action={deleteMeal}>
                                    <input type="hidden" name="householdId" value={household.id} />
                                    <input type="hidden" name="mealId" value={meal.id} />
                                    <button type="submit" className="negativeButton">Delete</button>
                                </form>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className={styles.emptyState}>No meals yet.</p>
                )}
            </div>
        </div>
    )
}
