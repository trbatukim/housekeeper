'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addGroceryItem(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return
    }

    const householdId = formData.get('householdId') as string
    const householdName = formData.get('householdName') as string
    const name = (formData.get('name') as string).trim()
    const groceriesPath = `/household/${encodeURIComponent(householdName)}/groceries`

    if (!name) {
        redirect(`${groceriesPath}?error=${encodeURIComponent('Item name cannot be empty.')}`)
    }

    const { data: existing } = await supabase
        .from('grocery_items')
        .select('id')
        .eq('household_id', householdId)
        .ilike('name', name)
        .maybeSingle()

    if (existing) {
        redirect(`${groceriesPath}?error=${encodeURIComponent(`"${name}" is already on the list.`)}`)
    }

    const { error } = await supabase
        .from('grocery_items')
        .insert({ household_id: householdId, name, added_by: user.id })

    if (error) {
        redirect(`${groceriesPath}?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath(groceriesPath)
}

export async function clearGroceryList(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return
    }

    const householdId = formData.get('householdId') as string
    const householdName = formData.get('householdName') as string
    const groceriesPath = `/household/${encodeURIComponent(householdName)}/groceries`

    const { error } = await supabase
        .from('grocery_items')
        .delete()
        .eq('household_id', householdId)

    if (error) {
        redirect(`${groceriesPath}?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath(groceriesPath)
}

export async function deleteGrocery(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return
    }

    const householdId = formData.get('householdId') as string
    const householdName = formData.get('householdName') as string
    const itemId = formData.get('itemId') as string
    const groceriesPath = `/household/${encodeURIComponent(householdName)}/groceries`

    const { error } = await supabase
        .from('grocery_items')
        .delete()
        .eq('household_id', householdId)
        .eq('id', itemId)

    if (error) {
        redirect(`${groceriesPath}?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath(groceriesPath)
}

export async function toggleGrocery(
  itemId: string,
  isPurchased: boolean,
  householdName: string
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('grocery_items')
    .update({ is_purchased: isPurchased })
    .eq('id', itemId)

  if (error) console.error(error)
  revalidatePath(`/household/${encodeURIComponent(householdName)}/groceries`)
}