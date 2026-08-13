'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendNtfyReq, cancelNtfyReq } from '@/lib/ntfy'

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

export async function addDishwasher(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return
    }

    const householdId = formData.get('householdId') as string
    const householdName = formData.get('householdName') as string
    const hours = Number(formData.get('hours')) || 0
    const minutes = Number(formData.get('minutes')) || 0
    const durationSeconds = hours * 3600 + minutes * 60
    const dishesPath = `/household/${encodeURIComponent(householdName)}/dishes`

    if (!durationSeconds || durationSeconds <= 0) {
        redirect(`${dishesPath}?error=${encodeURIComponent('Set an end time for the load')}`)
    }

    const endsAt = new Date(Date.now() + durationSeconds * 1000).toISOString()

    const notificationId = await sendNtfyReq("Dishwasher done!", endsAt, householdName, householdId)

    const { error } = await supabase
        .from('dishwasher_loads')
        .insert({
            household_id: householdId,
            ends_at: endsAt,
            status: 'running',
            ntfy_seq_id: notificationId ?? null,
        })

    if (error) {
        if (notificationId) {
            cancelNtfyReq(notificationId, householdId)
        }
        redirect(`${dishesPath}?error=${encodeURIComponent(error.message)}`)
    }

    await supabase
        .from('dishes_status')
        .update({ status: 'cleaning' })
        .eq('household_id', householdId)

    revalidatePath(dishesPath)
}

export async function deleteDishwasher(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return
    }

    const householdId = formData.get('householdId') as string
    const householdName = formData.get('householdName') as string
    const dishwasherId = formData.get('dishwasherId') as string
    const notificationId = formData.get('notificationId') as string
    const dishesPath = `/household/${encodeURIComponent(householdName)}/dishes`

    const { data, error } = await supabase
        .from('dishwasher_loads')
        .delete()
        .eq('household_id', householdId)
        .eq('id', dishwasherId)
        .select('id')

    if (error) {
        redirect(`${dishesPath}?error=${encodeURIComponent(error.message)}`)
    }

    if (!data || data.length === 0) {
        redirect(`${dishesPath}?error=${encodeURIComponent('Delete was blocked (check RLS delete policy on laundry_loads)')}`)
    }

    if (notificationId) {
        cancelNtfyReq(notificationId, householdId)
    }

    const { data: remainingLoads } = await supabase
        .from('dishwasher_loads')
        .select('id')
        .eq('household_id', householdId)
        .eq('status', 'running')

    if (!remainingLoads || remainingLoads.length === 0) {
        await supabase
            .from('dishes_status')
            .update({ status: 'clean' })
            .eq('household_id', householdId)
    }

    revalidatePath(dishesPath)
}