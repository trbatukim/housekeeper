'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function startDemo() {
    const supabase = await createClient()

    const { error: authError } = await supabase.auth.signInAnonymously({
        options: { data: { name: 'Guest' } },
    })

    if (authError) {
        console.error('startDemo: signInAnonymously failed', authError)
        redirect(`/welcome?error=${encodeURIComponent('Could not start the demo. Please try again.')}`)
    }

    const { data: householdId, error: householdError } = await supabase.rpc(
        'create_household_and_join',
        { household_name: 'Demo Household' }
    )

    if (householdError || !householdId) {
        redirect(`/welcome?error=${encodeURIComponent('Could not start the demo. Please try again.')}`)
    }

    const now = Date.now()

    const { error: groceriesError } = await supabase.from('grocery_items').insert([
        { household_id: householdId, name: 'Milk', amount: 1, amount_type: 'liter', is_purchased: false },
        { household_id: householdId, name: 'Eggs', amount: 12, amount_type: 'piece', is_purchased: false },
        { household_id: householdId, name: 'Coffee', amount: 500, amount_type: 'gram', is_purchased: true },
    ])
    if (groceriesError) console.error(groceriesError)

    const { error: expensesError } = await supabase.from('expenses').insert([
        { household_id: householdId, description: 'Internet bill', amount: 45, category: 'recurring', currency: 'dollar', is_paid: false },
        { household_id: householdId, description: 'Cleaning supplies', amount: 18.5, category: 'one-time', currency: 'dollar', is_paid: true },
    ])
    if (expensesError) console.error(expensesError)

    const { error: laundryError } = await supabase.from('laundry_loads').insert([
        { household_id: householdId, color: 'light', status: 'completed', ends_at: new Date(now - 60 * 60 * 1000).toISOString() },
        { household_id: householdId, color: 'dark', status: 'running', ends_at: new Date(now + 40 * 60 * 1000).toISOString() },
    ])
    if (laundryError) console.error(laundryError)

    const { error: dishwasherError } = await supabase.from('dishwasher_loads').insert([
        { household_id: householdId, status: 'completed', ends_at: new Date(now - 30 * 60 * 1000).toISOString() },
    ])
    if (dishwasherError) console.error(dishwasherError)

    redirect(`/household/${householdId}`)
}
