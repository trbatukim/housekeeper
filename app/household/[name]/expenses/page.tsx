import { addExpense, deleteExpense, rolloverRecurringExpenses } from './actions'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ExpenseItem from './ExpenseItem'

export default async function ExpensesPage({
    params,
    searchParams,
}: {
    params: Promise<{ name: string }>
    searchParams: Promise<{ error?: string }>
}) {
    const { name } = await params
    const decodedName = decodeURIComponent(name)
    const { error: errorMessage } = await searchParams

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: household } = await supabase
        .from('households')
        .select('id')
        .eq('name', decodedName)
        .maybeSingle()

    if (!household) {
        notFound()
    }

    await rolloverRecurringExpenses(household.id)

    const { data: expenses } = await supabase
        .from('expenses')
        .select('id, description, amount, category, paid_on, is_paid')
        .eq('household_id', household.id)
        .order('paid_on', { ascending: false })

    return (
        <>
            <h1>Expenses</h1>

            <form action={addExpense}>
                <input type="hidden" name="householdId" value={household.id} />
                <input type="hidden" name="householdName" value={decodedName} />
                <input type="text" name="description" placeholder="Description" required />
                <input type="number" name="amount" placeholder="Amount" step="0.01" min="0.01" required />
                <select name="category" required>
                    <option value="one-time">One-time</option>
                    <option value="recurring">Recurring</option>
                </select>
                <input type="date" name="paidOn" />
                <button type="submit">Add</button>
            </form>

            {errorMessage && <p>{errorMessage}</p>}

            <ul>
                {expenses?.map((expense) => (
                    <li key={expense.id} style={{ display: 'flex', gap: '8px' }}>
                        <ExpenseItem expense={expense} householdName={decodedName} />
                        <form action={deleteExpense} style={{ display: 'inline' }}>
                            <input type="hidden" name="householdId" value={household.id} />
                            <input type="hidden" name="householdName" value={decodedName} />
                            <input type="hidden" name="expenseId" value={expense.id} />
                            <button type="submit">Delete</button>
                        </form>
                    </li>
                ))}
            </ul>
        </>
    )
}