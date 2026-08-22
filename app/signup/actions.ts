'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NAME_MAX_LENGTH } from '@/lib/textLimits'

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (name.length > NAME_MAX_LENGTH) {
    redirect(`/signup?error=${encodeURIComponent(`Name cannot exceed ${NAME_MAX_LENGTH} characters.`)}`)
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  })
  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`)
  }
  redirect('/signup?message=' + encodeURIComponent('Check your email to confirm your account.'))
}
