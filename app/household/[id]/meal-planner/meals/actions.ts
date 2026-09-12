'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { NAME_MAX_LENGTH } from '@/lib/textLimits'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

type IngredientRow = {
    household_id: string
    name: string
    amount: number
    amount_type: string
}

const ingredientKey = (name: string, amount: number, amountType: string | null) =>
    `${name.trim().toLowerCase()}|${amount}|${(amountType ?? '').trim().toLowerCase()}`

function readIngredientRows(formData: FormData, householdId: string, mealsPath: string): IngredientRow[] {
    const ingredientNames = formData.getAll('ingredientName').map((value) => (value as string).trim())
    const ingredientAmounts = formData.getAll('ingredientAmount').map((value) => (value as string).trim())
    const ingredientAmountTypes = formData.getAll('ingredientAmountType').map((value) => (value as string).trim())

    return ingredientNames.map((ingredientName, index) => {
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
}

async function resolveIngredientIds(
    supabase: SupabaseClient,
    householdId: string,
    rows: IngredientRow[],
): Promise<{ ids: string[]; createdIds: string[]; error: string | null }> {
    if (rows.length === 0) {
        return { ids: [], createdIds: [], error: null }
    }

    const { data: householdIngredients } = await supabase
        .from('ingredients')
        .select('id, name, amount, amount_type')
        .eq('household_id', householdId)

    const reusedIds: string[] = []
    const newRows: IngredientRow[] = []
    const seen = new Set<string>()

    for (const row of rows) {
        const rowKey = ingredientKey(row.name, row.amount, row.amount_type)

        if (seen.has(rowKey)) {
            continue
        }

        seen.add(rowKey)

        const match = (householdIngredients ?? []).find((ingredient) =>
            ingredientKey(ingredient.name, Number(ingredient.amount), ingredient.amount_type) === rowKey)

        if (match) {
            reusedIds.push(match.id)
        } else {
            newRows.push(row)
        }
    }

    const createdIds: string[] = []

    if (newRows.length > 0) {
        const { data: insertedIngredients, error } = await supabase
            .from('ingredients')
            .insert(newRows)
            .select('id')

        if (error || !insertedIngredients) {
            return { ids: [], createdIds: [], error: error?.message ?? 'Could not add ingredients.' }
        }

        createdIds.push(...insertedIngredients.map((ingredient) => ingredient.id))
    }

    return { ids: [...reusedIds, ...createdIds], createdIds, error: null }
}

async function linkIngredients(supabase: SupabaseClient, mealId: string, ingredientIds: string[]) {
    if (ingredientIds.length === 0) {
        return null
    }

    const { error } = await supabase
        .from('meal_to_ingredient')
        .insert(ingredientIds.map((ingredientId) => ({ meal_id: mealId, ingredient_id: ingredientId })))

    return error?.message ?? null
}

async function pruneOrphanIngredients(supabase: SupabaseClient, householdId: string, ingredientIds: string[]) {
    if (ingredientIds.length === 0) {
        return
    }

    const { data: stillLinked } = await supabase
        .from('meal_to_ingredient')
        .select('ingredient_id')
        .in('ingredient_id', ingredientIds)

    const keep = new Set((stillLinked ?? []).map((link) => link.ingredient_id))
    const orphaned = ingredientIds.filter((ingredientId) => !keep.has(ingredientId))

    if (orphaned.length > 0) {
        await supabase
            .from('ingredients')
            .delete()
            .eq('household_id', householdId)
            .in('id', orphaned)
    }
}

export async function addMeal(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return
    }

    const householdId = formData.get('householdId') as string
    const name = (formData.get('name') as string).trim()
    const mealsPath = `/household/${householdId}/meal-planner/meals`

    if (!name) {
        redirect(`${mealsPath}?error=${encodeURIComponent('Meal name cannot be empty.')}`)
    }

    if (name.length > NAME_MAX_LENGTH) {
        redirect(`${mealsPath}?error=${encodeURIComponent(`Meal name cannot exceed ${NAME_MAX_LENGTH} characters.`)}`)
    }

    const ingredientRows = readIngredientRows(formData, householdId, mealsPath)

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
        const { ids, createdIds, error: resolveError } = await resolveIngredientIds(supabase, householdId, ingredientRows)

        if (resolveError) {
            await supabase.from('meals').delete().eq('id', meal.id)
            redirect(`${mealsPath}?error=${encodeURIComponent(resolveError)}`)
        }

        const linkError = await linkIngredients(supabase, meal.id, ids)

        if (linkError) {
            if (createdIds.length > 0) {
                await supabase.from('ingredients').delete().in('id', createdIds)
            }

            await supabase.from('meals').delete().eq('id', meal.id)
            redirect(`${mealsPath}?error=${encodeURIComponent(linkError)}`)
        }
    }

    revalidatePath(mealsPath)
}

export async function editMeal(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return
    }

    const householdId = formData.get('householdId') as string
    const mealId = formData.get('mealId') as string
    const name = (formData.get('name') as string).trim()
    const mealsPath = `/household/${householdId}/meal-planner/meals`

    if (!name) {
        redirect(`${mealsPath}?error=${encodeURIComponent('Meal name cannot be empty.')}`)
    }

    if (name.length > NAME_MAX_LENGTH) {
        redirect(`${mealsPath}?error=${encodeURIComponent(`Meal name cannot exceed ${NAME_MAX_LENGTH} characters.`)}`)
    }

    const ingredientRows = readIngredientRows(formData, householdId, mealsPath)

    const { data: existing } = await supabase
        .from('meals')
        .select('id')
        .eq('household_id', householdId)
        .ilike('name', name)
        .neq('id', mealId)
        .maybeSingle()

    if (existing) {
        redirect(`${mealsPath}?error=${encodeURIComponent(`"${name}" is already in your meals.`)}`)
    }

    const { data: meal, error } = await supabase
        .from('meals')
        .update({ name })
        .eq('id', mealId)
        .eq('household_id', householdId)
        .select('id')
        .maybeSingle()

    if (error) {
        redirect(`${mealsPath}?error=${encodeURIComponent(error.message)}`)
    }

    if (!meal) {
        redirect(`${mealsPath}?error=${encodeURIComponent('Could not find that meal.')}`)
    }

    const { data: links } = await supabase
        .from('meal_to_ingredient')
        .select('ingredient_id')
        .eq('meal_id', mealId)

    const previousIngredientIds = (links ?? []).map((link) => link.ingredient_id)

    const { ids, createdIds, error: resolveError } = await resolveIngredientIds(supabase, householdId, ingredientRows)

    if (resolveError) {
        redirect(`${mealsPath}?error=${encodeURIComponent(resolveError)}`)
    }

    await supabase
        .from('meal_to_ingredient')
        .delete()
        .eq('meal_id', mealId)

    const linkError = await linkIngredients(supabase, mealId, ids)

    if (linkError) {
        if (createdIds.length > 0) {
            await supabase.from('ingredients').delete().in('id', createdIds)
        }

        await linkIngredients(supabase, mealId, previousIngredientIds)
        redirect(`${mealsPath}?error=${encodeURIComponent(linkError)}`)
    }

    const dropped = previousIngredientIds.filter((ingredientId) => !ids.includes(ingredientId))
    await pruneOrphanIngredients(supabase, householdId, dropped)

    revalidatePath(mealsPath)
    revalidatePath(`/household/${householdId}/meal-planner`)
}

export async function addIngredientsToGroceries(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return
    }

    const householdId = formData.get('householdId') as string
    const ingredientIds = formData.getAll('ingredientId') as string[]
    const mealsPath = `/household/${householdId}/meal-planner/meals`

    if (ingredientIds.length === 0) {
        redirect(`${mealsPath}?error=${encodeURIComponent('Check at least one ingredient.')}`)
    }

    const { data: ingredients, error } = await supabase
        .from('ingredients')
        .select('name, amount, amount_type')
        .eq('household_id', householdId)
        .in('id', ingredientIds)

    if (error) {
        redirect(`${mealsPath}?error=${encodeURIComponent(error.message)}`)
    }

    if (!ingredients || ingredients.length === 0) {
        redirect(`${mealsPath}?error=${encodeURIComponent('Could not find those ingredients.')}`)
    }

    const { data: groceries } = await supabase
        .from('grocery_items')
        .select('name')
        .eq('household_id', householdId)

    const takenNames = new Set((groceries ?? []).map((item) => item.name.toLowerCase()))
    const toAdd = ingredients.filter((ingredient) => {
        const key = ingredient.name.toLowerCase()

        if (takenNames.has(key)) {
            return false
        }

        takenNames.add(key)
        return true
    })

    if (toAdd.length === 0) {
        redirect(`${mealsPath}?error=${encodeURIComponent('Those ingredients are already on the grocery list.')}`)
    }

    const { error: insertError } = await supabase
        .from('grocery_items')
        .insert(toAdd.map((ingredient) => ({
            household_id: householdId,
            name: ingredient.name,
            added_by: user.id,
            amount: ingredient.amount,
            amount_type: ingredient.amount_type,
        })))

    if (insertError) {
        redirect(`${mealsPath}?error=${encodeURIComponent(insertError.message)}`)
    }

    const skipped = ingredients.length - toAdd.length
    const notice = skipped > 0
        ? `Added ${toAdd.length} items to the grocery list (${skipped} items already there).`
        : `Added ${toAdd.length} items to the grocery list.`

    revalidatePath(`/household/${householdId}/groceries`)
    redirect(`${mealsPath}?notice=${encodeURIComponent(notice)}`)
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

    await pruneOrphanIngredients(supabase, householdId, (links ?? []).map((link) => link.ingredient_id))

    revalidatePath(mealsPath)
}
