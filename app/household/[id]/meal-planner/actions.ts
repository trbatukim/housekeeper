'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isDayOfWeek } from '@/lib/days'

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

    const { data: meal, error } = await supabase
        .from('meals')
        .update({ day_of_week: day })
        .eq('id', mealId)
        .eq('household_id', householdId)
        .select('id')
        .maybeSingle()

    if (error) {
        redirect(`${plannerPath}?error=${encodeURIComponent(error.message)}`)
    }

    if (!meal) {
        redirect(`${plannerPath}?error=${encodeURIComponent('Could not find that meal.')}`)
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
    const plannerPath = `/household/${householdId}/meal-planner`

    // The meal stays in the household's meal list, it just loses its planned day.
    const { error } = await supabase
        .from('meals')
        .update({ day_of_week: null })
        .eq('id', mealId)
        .eq('household_id', householdId)

    if (error) {
        redirect(`${plannerPath}?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath(plannerPath)
}
