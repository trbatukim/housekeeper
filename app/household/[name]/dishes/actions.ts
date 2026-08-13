'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleDishesStatus(
    householdId: string,
    newStatus: string,
    householdName: string
) {
    const supabase = await createClient()
    const { error } = await supabase
    .from('dishes_status')
    .update({ status: newStatus })
    .eq('household_id', householdId)

    if (error) console.error(error)
    revalidatePath(`/household/${encodeURIComponent(householdName)}/dishes`)
}