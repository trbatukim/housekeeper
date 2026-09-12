'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { NAME_MAX_LENGTH } from '@/lib/textLimits'

export async function addMeal(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return
    }

    const householdId = formData.get('householdId') as string
    const name = (formData.get('name') as string).trim()
    const ingredientNames = formData.getAll('ingredientName').map((value) => (value as string).trim())
    const ingredientAmounts = formData.getAll('ingredientAmount').map((value) => (value as string).trim())
    const ingredientAmountTypes = formData.getAll('ingredientAmountType').map((value) => (value as string).trim())
    const mealsPath = `/household/${householdId}/meal-planner/meals`

    if (!name) {
        redirect(`${mealsPath}?error=${encodeURIComponent('Meal name cannot be empty.')}`)
    }

    if (name.length > NAME_MAX_LENGTH) {
        redirect(`${mealsPath}?error=${encodeURIComponent(`Meal name cannot exceed ${NAME_MAX_LENGTH} characters.`)}`)
    }

    const ingredientRows = ingredientNames.map((ingredientName, index) => {
        const amountRaw = ingredientAmounts[index]
        const amountType = ingredientAmountTypes[index]

        if (!ingredientName) {
            redirect(`${mealsPath}?error=${encodeURIComponent('Ingredient name cannot be empty.')}`)
        }

        if (ingredientName.length > NAME_MAX_LENGTH) {
            redirect(`${mealsPath}?error=${encodeURIComponent(`Ingredient name cannot exceed ${NAME_MAX_LENGTH} characters.`)}`)
        }

        if (!amountRaw || !amountType) {
            redirect(`${mealsPath}?error=${encodeURIComponent(`Amount and unit are required for "${ingredientName}".`)}`)
        }

        if (amountType.length > NAME_MAX_LENGTH) {
            redirect(`${mealsPath}?error=${encodeURIComponent(`Custom unit cannot exceed ${NAME_MAX_LENGTH} characters.`)}`)
        }

        const amount = Number(amountRaw)

        if (Number.isNaN(amount)) {
            redirect(`${mealsPath}?error=${encodeURIComponent(`Amount for "${ingredientName}" must be a number.`)}`)
        }

        return { household_id: householdId, name: ingredientName, amount, amount_type: amountType }
    })

    const { data: existing } = await supabase
        .from('meals')
        .select('id')
        .eq('household_id', householdId)
        .ilike('name', name)
        .maybeSingle()

    if (existing) {
        redirect(`${mealsPath}?error=${encodeURIComponent(`"${name}" is already in your meals.`)}`)
    }

    const { data: meal, error } = await supabase
        .from('meals')
        .insert({ household_id: householdId, name })
        .select('id')
        .single()

    if (error || !meal) {
        redirect(`${mealsPath}?error=${encodeURIComponent(error?.message ?? 'Could not add meal.')}`)
    }

    if (ingredientRows.length > 0) {
        const { data: insertedIngredients, error: ingredientsError } = await supabase
            .from('ingredients')
            .insert(ingredientRows)
            .select('id')

        if (ingredientsError || !insertedIngredients) {
            await supabase.from('meals').delete().eq('id', meal.id)
            redirect(`${mealsPath}?error=${encodeURIComponent(ingredientsError?.message ?? 'Could not add ingredients.')}`)
        }

        const { error: linkError } = await supabase
            .from('meal_to_ingredient')
            .insert(insertedIngredients.map((ingredient) => ({ meal_id: meal.id, ingredient_id: ingredient.id })))

        if (linkError) {
            await supabase.from('ingredients').delete().in('id', insertedIngredients.map((ingredient) => ingredient.id))
            await supabase.from('meals').delete().eq('id', meal.id)
            redirect(`${mealsPath}?error=${encodeURIComponent(linkError.message)}`)
        }
    }

    revalidatePath(mealsPath)
}

export async function deleteMeal(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return
    }

    const householdId = formData.get('householdId') as string
    const mealId = formData.get('mealId') as string
    const mealsPath = `/household/${householdId}/meal-planner/meals`

    // Read the links first: deleting the meal cascades them away, but the
    // ingredient rows they point at belong to this meal and would be orphaned.
    const { data: links } = await supabase
        .from('meal_to_ingredient')
        .select('ingredient_id')
        .eq('meal_id', mealId)

    const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId)
        .eq('household_id', householdId)

    if (error) {
        redirect(`${mealsPath}?error=${encodeURIComponent(error.message)}`)
    }

    if (links && links.length > 0) {
        await supabase
            .from('ingredients')
            .delete()
            .eq('household_id', householdId)
            .in('id', links.map((link) => link.ingredient_id))
    }

    revalidatePath(mealsPath)
}
