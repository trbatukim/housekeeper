'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function leaveHousehold(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return
  }

  const householdId = formData.get('householdId') as string

  const { error } = await supabase
    .from('profiles_to_households')
    .delete()
    .eq('profile_id', user.id)
    .eq('household_id', householdId)

  if (error) {
    console.error(error)
    return
  }

  revalidatePath('/household')
}
