'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createHousehold(formData: FormData) {
  const supabase = await createClient()
  const name = (formData.get('name') as string).trim()

  if (!name) {
    redirect(`/household/setup?error=${encodeURIComponent('Household name cannot be empty.')}`)
  }

  const { error } = await supabase.rpc('create_household_and_join', { household_name: name })
  if (error) redirect(`/household/setup?error=${encodeURIComponent(error.message)}`)
  redirect('/')
}

export async function joinHousehold(formData: FormData) {
  const supabase = await createClient()
  const householdId = formData.get('householdId') as string
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('profiles_to_households')
    .insert({ profile_id: user.id, household_id: householdId })

  if (error) {
    let message = error.message
    
    switch (error.code) {
      case '23505':
        message = 'You are already a member of this household.'
        break
      case '22P02':
        message = 'Invalid household ID. Please double-check and try again.'
        break
      case '23503':
        message = 'No household with that ID exists. Please double-check and try again.'
        break
      default:
        message = 'Something went wrong. Please try again.'
    }
    
    redirect(`/household/setup?error=${encodeURIComponent(message)}`)
  }
  redirect('/')
}