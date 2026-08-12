'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addExpense(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return
    }

    const householdId = formData.get('householdId') as string
    const householdName = formData.get('householdName') as string
    const description = (formData.get('description') as string).trim()
    const amount = Number(formData.get('amount') as string)
    const category = formData.get('category') as string
    const paidOn = formData.get('paidOn') as string
    const expensesPath = `/household/${encodeURIComponent(householdName)}/expenses`

    if (!description || Number.isNaN(amount) || amount <= 0) {
        redirect(`${expensesPath}?error=${encodeURIComponent('Enter a valid description and amount')}`)
    }

    if (category !== 'recurring' && category !== 'one-time') {
        redirect(`${expensesPath}?error=${encodeURIComponent('Invalid category')}`)
    }

    const { data: existing } = await supabase
        .from('expenses')
        .select('id')
        .eq('household_id', householdId)
        .eq('paid_on', paidOn || new Date().toISOString().split('T')[0])
        .ilike('description', description)
        .maybeSingle()

    if (existing) {
        redirect(`${expensesPath}?error=${encodeURIComponent(`"${description}" is already logged for that date`)}`)
    }

    const { error } = await supabase
        .from('expenses')
        .insert({
            household_id: householdId,
            description,
            amount,
            category,
            ...(paidOn ? { paid_on: paidOn } : {}),
        })

    if (error) {
        redirect(`${expensesPath}?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath(expensesPath)
}

export async function deleteExpense(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return
    }

    const householdId = formData.get('householdId') as string
    const householdName = formData.get('householdName') as string
    const expenseId = formData.get('expenseId') as string

    const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('household_id', householdId)
        .eq('id', expenseId)

    if (error) {
        console.error(error)
        return
    }

    revalidatePath(`/household/${encodeURIComponent(householdName)}/expenses`)
}

export async function toggleExpense(
    expenseId: string,
    isPaid: boolean,
    householdName: string
) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('expenses')
        .update({ is_paid: isPaid })
        .eq('id', expenseId)

    if (error) console.error(error)
    revalidatePath(`/household/${encodeURIComponent(householdName)}/expenses`)
}