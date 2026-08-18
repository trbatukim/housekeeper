'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updatePrimaryColor(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return
    }

    const householdId = formData.get('householdId') as string
    const householdName = formData.get('householdName') as string
    const color = formData.get('color') as string
    const path = `/household/${encodeURIComponent(householdName)}`

    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
        return
    }

    const { error } = await supabase
        .from('households')
        .update({ primary_color: color })
        .eq('id', householdId)

    if (error) {
        redirect(`${path}?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath(path)
    revalidatePath(`${path}/groceries`)
    revalidatePath(`${path}/expenses`)
    revalidatePath(`${path}/laundry`)
}
