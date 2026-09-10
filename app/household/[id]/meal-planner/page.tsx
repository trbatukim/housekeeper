import styles from '../theme.module.css'
import type { Metadata } from "next";
import { NAME_MAX_LENGTH } from '@/lib/textLimits'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import HouseholdThemeSync from '../../../HouseholdThemeSync'
import { addMealToDay, deleteMealFromDay } from './actions'

const DEFAULT_COLOR = '#a98bff'

const DAYS = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
] as const

type Meal = {
    id: string
    name: string
}

const mealsByDay: Record<(typeof DAYS)[number], Meal[]> = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
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
                    <input
                        type="text"
                        name="name"
                        placeholder="Add a meal"
                        required
                        maxLength={NAME_MAX_LENGTH}
                        className={styles.input}
                    />

                    <select name="day" className={styles.select}>
                        <option value='Monday'>Monday</option>
                        <option value='Monday'>Tuesday</option>
                        <option value='Monday'>Wednesday</option>
                        <option value='Monday'>Thursday</option>
                        <option value='Monday'>Friday</option>
                        <option value='Monday'>Saturday</option>
                        <option value='Monday'>Sunday</option>
                    </select>

                    <button type="submit" className={styles.button}>Add</button>
                </form>

                {DAYS.map((day) => {
                    const meals = mealsByDay[day]

                    return (
                        <section key={day} className={styles.daySection}>
                            <div className={styles.dayDivider}>
                                <span className={styles.dayDividerLine} />
                                <h2 className={styles.dayDividerLabel}>{day}</h2>
                                <span className={styles.dayDividerLine} />
                            </div>

                            {meals.length > 0 ? (
                                <ul className={styles.list}>
                                    {meals.map((meal) => (
                                        <li key={meal.id} className={styles.item}>
                                            <span>{meal.name}</span>
                                            <form action={deleteMealFromDay}>
                                                <input type="hidden" name="householdId" value={household.id} />
                                                <input type="hidden" name="mealId" value={meal.id} />
                                                <button type="submit" className="negativeButton">Delete</button>
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
