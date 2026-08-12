'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function sendNtfyReq(textBody: string, endsAt: string, householdName: string, householdId: string) {
    const url = 'https://ntfy.sh/' + householdId
    const delayUnixSeconds = Math.floor(new Date(endsAt).getTime() / 1000)

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
                'title': householdName,
                'X-Delay': String(delayUnixSeconds)
            },
            body: textBody
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json() as { id: string }
        return result.id
    } catch (error) {
        console.error('Request failed:', error)
    }
}

async function cancelNtfyReq(notificationId: string, householdId: string) {
    const url = 'https://ntfy.sh/' + householdId + '/' + notificationId

    try {
        const response = await fetch(url, {
            method: 'DELETE'
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        console.log(response)
    } catch (error) {
        console.error('Request failed:', error)
    }
}

export async function addLaundry(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return
    }

    const householdId = formData.get('householdId') as string
    const householdName = formData.get('householdName') as string
    const durationSeconds = Number(formData.get('durationSeconds'))
    const laundryPath = `/household/${encodeURIComponent(householdName)}/laundry`

    if (!durationSeconds || durationSeconds <= 0) {
        redirect(`${laundryPath}?error=${encodeURIComponent('Set an end time for the load')}`)
    }

    const endsAt = new Date(Date.now() + durationSeconds * 1000).toISOString()

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

    revalidatePath(laundryPath)
}

export async function deleteLaundry(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return
    }

    const householdId = formData.get('householdId') as string
    const householdName = formData.get('householdName') as string
    const laundryId = formData.get('laundryId') as string
    const notificationId = formData.get('notificationId') as string
    const laundryPath = `/household/${encodeURIComponent(householdName)}/laundry`

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
        redirect(`${laundryPath}?error=${encodeURIComponent('Delete was blocked (check RLS delete policy on laundry_loads)')}`)
    }

    if (notificationId) {
        cancelNtfyReq(notificationId, householdId)
    }

    revalidatePath(laundryPath)
}
