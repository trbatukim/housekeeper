'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updatePrimaryColor(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return
    }

    const householdId = formData.get('householdId') as string
    const householdName = formData.get('householdName') as string
    const color = formData.get('color') as string

    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
        return
    }

    const { error } = await supabase
        .from('households')
        .update({ primary_color: color })
        .eq('id', householdId)

    if (error) {
        console.error(error)
        return
    }

    const path = `/household/${encodeURIComponent(householdName)}`
    revalidatePath(path)
    revalidatePath(`${path}/groceries`)
    revalidatePath(`${path}/expenses`)
    revalidatePath(`${path}/laundry`)
}
