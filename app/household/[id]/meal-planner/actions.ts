'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { dayLabel, isDayOfWeek } from '@/lib/days'

const UNIQUE_VIOLATION = '23505'

export async function addMealToDay(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return
    }

    const householdId = formData.get('householdId') as string
    const mealId = formData.get('mealId') as string
    const day = formData.get('day') as string
    const plannerPath = `/household/${householdId}/meal-planner`

    if (!mealId) {
        redirect(`${plannerPath}?error=${encodeURIComponent('Pick a meal to plan.')}`)
    }

    if (!isDayOfWeek(day)) {
        redirect(`${plannerPath}?error=${encodeURIComponent('Pick a day of the week.')}`)
    }

    const { data: meal } = await supabase
        .from('meals')
        .select('id, name')
        .eq('id', mealId)
        .eq('household_id', householdId)
        .maybeSingle()

    if (!meal) {
        redirect(`${plannerPath}?error=${encodeURIComponent('Could not find that meal.')}`)
    }

    const { error } = await supabase
        .from('meal_to_day')
        .insert({ meal_id: meal.id, day_of_week: day })

    if (error?.code === UNIQUE_VIOLATION) {
        redirect(`${plannerPath}?error=${encodeURIComponent(`"${meal.name}" is already planned for ${dayLabel(day)}.`)}`)
    }

    if (error) {
        redirect(`${plannerPath}?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath(plannerPath)
}

export async function deleteMealFromDay(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return
    }

    const householdId = formData.get('householdId') as string
    const mealId = formData.get('mealId') as string
    const day = formData.get('day') as string
    const plannerPath = `/household/${householdId}/meal-planner`

    if (!isDayOfWeek(day)) {
        redirect(`${plannerPath}?error=${encodeURIComponent('Pick a day of the week.')}`)
    }

    const { data: meal } = await supabase
        .from('meals')
        .select('id')
        .eq('id', mealId)
        .eq('household_id', householdId)
        .maybeSingle()

    if (!meal) {
        redirect(`${plannerPath}?error=${encodeURIComponent('Could not find that meal.')}`)
    }

    const { error } = await supabase
        .from('meal_to_day')
        .delete()
        .eq('meal_id', meal.id)
        .eq('day_of_week', day)

    if (error) {
        redirect(`${plannerPath}?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath(plannerPath)
}
