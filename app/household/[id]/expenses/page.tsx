import { addExpense, deleteExpense, rolloverRecurringExpenses, sendReminder } from './actions'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import ExpenseItem from './ExpenseItem'
import EditExpenseItem from './EditExpenseItem'
import styles from '../theme.module.css'
import HouseholdThemeSync from '../../../HouseholdThemeSync'
import type { Metadata } from "next";
import { TEXT_MAX_LENGTH } from '@/lib/textLimits'

const DEFAULT_COLOR = '#a98bff'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: household } = await supabase
    .from('households')
    .select('name')
    .eq('id', id)
    .maybeSingle()

  return {
    title: `Expenses - ${household?.name ?? 'Household'}`,
  }
}

export default async function ExpensesPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ error?: string }>
}) {
    const { id } = await params
    const { error: errorMessage } = await searchParams

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: household } = await supabase
        .from('households')
        .select('id, name, primary_color')
        .eq('id', id)
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
            <Link href={`/household/${household.id}`} className={styles.themedBackButton}>&larr; Back</Link>
            <h1 className={styles.pageTitle}>Expenses</h1>
            <p className={styles.note}>To get notifications, subscribe to the ntfy topic: ntfy.sh/{household.id} <Link href="../../ntfy-info">More info</Link></p>
            <div className={styles.card}>
                <form action={addExpense} className={styles.form}>
                    <input type="hidden" name="householdId" value={household.id} />

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

                    <input type="date" name="paidOn" placeholder="Date" className={styles.input} />
                    <button type="submit" className={styles.button}>Add</button>
                </form>

                {errorMessage && <p className="error">{errorMessage}</p>}

                <ul className={styles.list}>
                    {expenses?.map((expense) => (
                        <li key={expense.id} className={styles.item}>
                            <ExpenseItem expense={expense} householdId={household.id} />
                            <div className={styles.itemActions}>
                                <form action={sendReminder} className={styles.toolbarFormGroup}>
                                    <input type="hidden" name="householdId" value={household.id} />
                                    <input type="hidden" name="householdName" value={household.name} />
                                    <input type="hidden" name="expenseDesc" value={expense.description} />
                                    <input type="hidden" name="dueDate" value={expense.paid_on} />
                                    <button type="submit" className={`${styles.button} ${styles.itemButton}`} title="Send reminder">Remind</button>
                                </form>
                                <EditExpenseItem expense={expense} householdId={household.id} primaryColor={primaryColor} />
                                <form action={deleteExpense}>
                                    <input type="hidden" name="householdId" value={household.id} />
                                    <input type="hidden" name="expenseId" value={expense.id} />
                                    <button type="submit" className="negativeButton">Delete</button>
                                </form>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
