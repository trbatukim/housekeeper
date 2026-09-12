import styles from '../../theme.module.css'
import type { Metadata } from "next";
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import HouseholdThemeSync from '../../../../HouseholdThemeSync'
import AddMealItem from './AddMealItem'
import MealItem from './MealItem'

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
    searchParams: Promise<{ error?: string; notice?: string }>
}) {
    const { id } = await params
    const { error: errorMessage, notice } = await searchParams

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

    const { data: savedIngredients } = await supabase
        .from('ingredients')
        .select('id, name, amount, amount_type')
        .eq('household_id', household.id)
        .order('created_at', { ascending: false })

    const seenNames = new Set<string>()
    const ingredientOptions = (savedIngredients ?? [])
        .filter((ingredient) => {
            const key = ingredient.name.toLowerCase()

            if (seenNames.has(key)) {
                return false
            }

            seenNames.add(key)
            return true
        })
        .sort((a, b) => a.name.localeCompare(b.name))

    const primaryColor = household.primary_color ?? DEFAULT_COLOR

    return (
        <div className={styles.page} style={{ '--primary': primaryColor } as CSSProperties}>
            <HouseholdThemeSync color={primaryColor} />
            <Link href={`/household/${household.id}/meal-planner`} className={styles.themedBackButton}>&larr; Back</Link>
            <h1 className={styles.pageTitle}>Meals</h1>

            {errorMessage && <p className="error">{errorMessage}</p>}
            {notice && <p className={styles.notice}>{notice}</p>}

            <div className={styles.card}>
                <AddMealItem
                    householdId={household.id}
                    primaryColor={primaryColor}
                    savedIngredients={ingredientOptions}
                />

                {meals && meals.length > 0 ? (
                    <ul className={styles.list}>
                        {meals.map((meal) => (
                            <MealItem
                                key={meal.id}
                                meal={{ id: meal.id, name: meal.name, ingredients: meal.meal_to_ingredient }}
                                householdId={household.id}
                            />
                        ))}
                    </ul>
                ) : (
                    <p className={styles.emptyState}>No meals yet.</p>
                )}
            </div>
        </div>
    )
}
