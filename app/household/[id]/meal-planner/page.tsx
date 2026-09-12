import styles from '../theme.module.css'
import type { Metadata } from "next";
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import HouseholdThemeSync from '../../../HouseholdThemeSync'
import { DAYS_OF_WEEK, dayLabel, isDayOfWeek, type DayOfWeek } from '@/lib/days'
import { addMealToDay, deleteMealFromDay } from './actions'

const DEFAULT_COLOR = '#a98bff'

type Meal = {
    id: string
    name: string
}

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
    title: `Meal Planner - ${household?.name ?? 'Household'}`,
  }
}

export default async function MealPlanner({
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
        .select('id, name, meal_to_day(day_of_week)')
        .eq('household_id', household.id)
        .order('name')

    const mealsByDay = Object.fromEntries(
        DAYS_OF_WEEK.map((day) => [day, [] as Meal[]]),
    ) as Record<DayOfWeek, Meal[]>

    for (const meal of meals ?? []) {
        for (const { day_of_week: day } of meal.meal_to_day) {
            if (isDayOfWeek(day)) {
                mealsByDay[day].push({ id: meal.id, name: meal.name })
            }
        }
    }

    const primaryColor = household.primary_color ?? DEFAULT_COLOR

    return (
        <div className={styles.page} style={{ '--primary': primaryColor } as CSSProperties}>
            <HouseholdThemeSync color={primaryColor} />
            <Link href={`/household/${household.id}`} className={styles.themedBackButton}>&larr; Back</Link>
            <h1 className={styles.pageTitle}>Meal Planner</h1>

            {errorMessage && <p className="error">{errorMessage}</p>}

            <div className={styles.card}>
                <Link href={`/household/${household.id}/meal-planner/meals`} className={styles.navLink}>View All Meals</Link>

                <form action={addMealToDay} className={styles.form}>
                    <input type="hidden" name="householdId" value={household.id} />

                    <select name="mealId" defaultValue="" required className={styles.select}>
                        <option value="" disabled>Pick a meal</option>
                        {(meals ?? []).map((meal) => (
                            <option key={meal.id} value={meal.id}>{meal.name}</option>
                        ))}
                    </select>

                    <select name="day" defaultValue={DAYS_OF_WEEK[0]} className={styles.select}>
                        {DAYS_OF_WEEK.map((day) => (
                            <option key={day} value={day}>{dayLabel(day)}</option>
                        ))}
                    </select>

                    <button type="submit" className={styles.button}>Add</button>
                </form>

                {DAYS_OF_WEEK.map((day) => {
                    const dayMeals = mealsByDay[day]

                    return (
                        <section key={day} className={styles.daySection}>
                            <div className={styles.dayDivider}>
                                <span className={styles.dayDividerLine} />
                                <h2 className={styles.dayDividerLabel}>{dayLabel(day)}</h2>
                                <span className={styles.dayDividerLine} />
                            </div>

                            {dayMeals.length > 0 ? (
                                <ul className={styles.list}>
                                    {dayMeals.map((meal) => (
                                        <li key={meal.id} className={styles.item}>
                                            <span>{meal.name}</span>
                                            <form action={deleteMealFromDay}>
                                                <input type="hidden" name="householdId" value={household.id} />
                                                <input type="hidden" name="mealId" value={meal.id} />
                                                <input type="hidden" name="day" value={day} />
                                                <button type="submit" className="negativeButton">Remove</button>
                                            </form>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className={styles.emptyState}>No meals planned.</p>
                            )}
                        </section>
                    )
                })}
            </div>
        </div>
    )
}
