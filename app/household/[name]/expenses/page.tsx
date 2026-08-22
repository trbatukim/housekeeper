import { addExpense, deleteExpense, rolloverRecurringExpenses } from './actions'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import ExpenseItem from './ExpenseItem'
import styles from '../theme.module.css'
import HouseholdThemeSync from '../../../HouseholdThemeSync'
import type { Metadata } from "next";
import { TEXT_MAX_LENGTH } from '@/lib/textLimits'

const DEFAULT_COLOR = '#a98bff'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>
}): Promise<Metadata> {
  const { name } = await params
  return {
    title: `Expenses - ${decodeURIComponent(name)}`,
  }
}

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
        .select('id, primary_color')
        .eq('name', decodedName)
        .maybeSingle()

    if (!household) {
        notFound()
    }

    await rolloverRecurringExpenses(household.id)

    const { data: expenses } = await supabase
        .from('expenses')
        .select('id, description, amount, currency, category, paid_on, is_paid')
        .eq('household_id', household.id)
        .order('paid_on', { ascending: false })

    const primaryColor = household.primary_color ?? DEFAULT_COLOR

    return (
        <div className={styles.page} style={{ '--primary': primaryColor } as CSSProperties}>
            <HouseholdThemeSync color={primaryColor} />
            <Link href={`/household/${decodedName}`} className={styles.themedBackButton}>&larr; Back</Link>
            <h1 className={styles.pageTitle}>Expenses</h1>
            <div className={styles.card}>
                <form action={addExpense} className={styles.form}>
                    <input type="hidden" name="householdId" value={household.id} />
                    <input type="hidden" name="householdName" value={decodedName} />
                    
                    <input type="text" name="description" placeholder="Description" required maxLength={TEXT_MAX_LENGTH} className={styles.input} />
                    
                    <input type="number" step="0.01" name="amount" required placeholder="Price" className={styles.input} />
                    <select name="currency" className={styles.select}>
                        <option value="euro">Euro €</option>
                        <option value="dollar">Dollar $</option>
                        <option value="tl">Turkish Lira ₺</option>
                        <option value="pound">Pound £</option>
                    </select>

                    <select name="category" className={styles.select}>
                        <option value='one-time'>One-time</option>
                        <option value='recurring'>Recurring</option>
                    </select>

                    <input type="date" name="paidOn" className={styles.input} />
                    <button type="submit" className={styles.button}>Add</button>
                </form>

                {errorMessage && <p className="error">{errorMessage}</p>}

                <ul className={styles.list}>
                    {expenses?.map((expense) => (
                        <li key={expense.id} className={styles.item}>
                            <ExpenseItem expense={expense} householdName={decodedName} />
                            <form action={deleteExpense}>
                                <input type="hidden" name="householdId" value={household.id} />
                                <input type="hidden" name="householdName" value={decodedName} />
                                <input type="hidden" name="expenseId" value={expense.id} />
                                <button type="submit" className="negativeButton">Delete</button>
                            </form>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
