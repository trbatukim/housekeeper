'use server'
import {createClient} from '@/lib/supabase/server'
import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'
import {cancelNtfyReq, sendNtfyReq} from '@/lib/ntfy'
import {ActivityType, createLiveActivity, deleteLiveActivity} from '@/lib/pushward'
import {computeDurationSeconds, isValidDuration} from '@/lib/duration'

export async function addLaundry(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return
    }

    const householdId = formData.get('householdId') as string
    const householdName = formData.get('householdName') as string
    const hours = Number(formData.get('hours')) || 0
    const minutes = Number(formData.get('minutes')) || 0
    const durationSeconds = computeDurationSeconds(hours, minutes)
    const laundryPath = `/household/${householdId}/laundry`

    if (!isValidDuration(durationSeconds)) {
        redirect(`${laundryPath}?error=${encodeURIComponent('Set an end time for the load.')}`)
    }

    const endsAtDate = new Date(Date.now() + durationSeconds * 1000)
    const endsAt = endsAtDate.toISOString()

    const notificationId = await sendNtfyReq("Laundry done!", endsAt, householdName, householdId)

    const { error } = await supabase
        .from('laundry_loads')
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
        redirect(`${laundryPath}?error=${encodeURIComponent(error.message)}`)
    }

    createLiveActivity(ActivityType.LAUNDRY, endsAtDate, householdId)

    revalidatePath(laundryPath)
}

export async function deleteLaundry(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return
    }

    const householdId = formData.get('householdId') as string
    const laundryId = formData.get('laundryId') as string
    const notificationId = formData.get('notificationId') as string
    const laundryPath = `/household/${householdId}/laundry`

    const { data, error } = await supabase
        .from('laundry_loads')
        .delete()
        .eq('household_id', householdId)
        .eq('id', laundryId)
        .select('id')

    if (error) {
        redirect(`${laundryPath}?error=${encodeURIComponent(error.message)}`)
    }

    if (!data || data.length === 0) {
        redirect(`${laundryPath}?error=${encodeURIComponent('Delete was blocked (check RLS delete policy on laundry_loads).')}`)
    }

    if (notificationId) {
        cancelNtfyReq(notificationId, householdId)
    }

    deleteLiveActivity(ActivityType.LAUNDRY, householdId)

    revalidatePath(laundryPath)
}
