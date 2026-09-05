import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { addGroceryItem, clearGroceryList, clearCheckedGroceries, deleteGrocery, sendReminder } from './actions'
import GroceryItem from './GroceryItem'
import AmountTypeField from './AmountTypeField'
import styles from '../theme.module.css'
import HouseholdThemeSync from '../../../HouseholdThemeSync'
import type { Metadata } from "next";
import { NAME_MAX_LENGTH } from '@/lib/textLimits'

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
    title: `Groceries - ${household?.name ?? 'Household'}`,
  }
}

export default async function Groceries({
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

    const { data: groceries, error } = await supabase
        .from('grocery_items')
        .select('id, name, is_purchased, amount, amount_type')
        .eq('household_id', household.id)
        .order('created_at')

    const primaryColor = household.primary_color ?? DEFAULT_COLOR

    return (
        <div className={styles.page} style={{ '--primary': primaryColor } as CSSProperties}>
            <HouseholdThemeSync color={primaryColor} />
            <Link href={`/household/${household.id}`} className={styles.themedBackButton}>&larr; Back</Link>
            <h1 className={styles.pageTitle}>Groceries</h1>
            <p className={styles.note}>To get notifications, subscribe to the ntfy topic: ntfy.sh/{household.id} <Link href="../../ntfy-info">More info</Link></p>
            <div className={styles.card}>
                <form action={addGroceryItem} className={styles.form}>
                    <input type="hidden" name="householdId" value={household.id} />
                    <input type="text" name="name" placeholder="Add an item" required maxLength={NAME_MAX_LENGTH} className={styles.input} />
                    <input type="number" step="0.01" name="amount" placeholder="Amount" required className={styles.input} />
                    <AmountTypeField />
                    <button type="submit" className={styles.button}>Add</button>
                </form>

                {errorMessage && <p className="error">{errorMessage}</p>}

                {groceries && groceries.length > 0 ? (
                    <ul className={styles.list}>
                        {groceries?.map((item) => (
                            <li key={item.id} className={styles.item}>
                                <GroceryItem item={item} householdId={household.id} />
                                <form action={deleteGrocery}>
                                    <input type="hidden" name="householdId" value={household.id} />
                                    <input type="hidden" name="itemId" value={item.id} />
                                    <button type="submit" className="negativeButton">Delete</button>
                                </form>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className={styles.emptyState}>Groceries list is empty.</p>
                )}

                <div className={styles.toolbar}>
                    <form action={clearGroceryList} className={styles.toolbarFormGroup}>
                        <input type="hidden" name="householdId" value={household.id} />
                        <button type="submit" className={styles.button}>Clear list</button>
                    </form>
                    <form action={clearCheckedGroceries} className={styles.toolbarFormGroup}>
                        <input type="hidden" name="householdId" value={household.id} />
                        <button type="submit" className={styles.button}>Clear bought groceries</button>
                    </form>
                    <form action={sendReminder} className={styles.toolbarFormGroup}>
                        <input type="hidden" name="householdId" value={household.id} />
                        <input type="hidden" name="householdName" value={household.name} />
                        <button type="submit" className={styles.button}>Send Reminder</button>
                    </form>
                </div>
            </div>
        </div>
    )
}
