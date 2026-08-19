'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const CATEGORIES = ['bug', 'idea', 'other']
const HOUSEHOLD_PATH_RE = /^\/household\/([^/]+)/

export async function submitFeedback(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const message = (formData.get('message') as string).trim()
    const category = formData.get('category') as string
    const pagePath = formData.get('pagePath') as string
    const email = (formData.get('email') as string | null)?.trim() || null

    if (!message) {
        redirect(`/feedback?error=${encodeURIComponent('Please enter a message.')}`)
    }

    if (!CATEGORIES.includes(category)) {
        redirect(`/feedback?error=${encodeURIComponent('Invalid category.')}`)
    }

    let householdId: string | null = null
    const householdMatch = user && pagePath.match(HOUSEHOLD_PATH_RE)
    if (householdMatch) {
        const householdName = decodeURIComponent(householdMatch[1])
        const { data: membership } = await supabase
            .from('profiles_to_households')
            .select('households!inner(id, name)')
            .eq('profile_id', user.id)
            .eq('households.name', householdName)
            .maybeSingle()

        const household = membership?.households
            ? (Array.isArray(membership.households) ? membership.households[0] : membership.households)
            : null
        householdId = household?.id ?? null
    }

    const { error } = await supabase
        .from('feedback')
        .insert({
            profile_id: user?.id ?? null,
            household_id: householdId,
            category,
            message,
            ...(pagePath ? { page_path: pagePath } : {}),
            ...(email ? { email } : {}),
        })

    if (error) {
        redirect(`/feedback?error=${encodeURIComponent(error.message)}`)
    }

    redirect('/feedback?success=1')
}
