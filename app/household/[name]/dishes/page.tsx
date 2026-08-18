import styles from '../theme.module.css'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import DishesItem from './DishesItem'
import DishwasherItem from './DishwasherItem'
import { deleteDishwasher, addDishwasher } from './actions'
import EndTimePicker from '@/components/EndTimePicker'

const DEFAULT_COLOR = '#a98bff'

export default async function DishesPage({
    params,
    searchParams
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

    const { data: dishesStatus } = await supabase
        .from('dishes_status')
        .select('status')
        .eq('household_id', household.id)

    const { data: dishwasherLoads } = await supabase
        .from('dishwasher_loads')
        .select('id, ends_at, status, ntfy_seq_id')
        .eq('household_id', household.id)
        .order('created_at')

    const primaryColor = household.primary_color ?? DEFAULT_COLOR
    const isDishwasherRunning = dishwasherLoads?.some((load) => load.status === 'running') ?? false

    return (
        <div className={styles.page} style={{ '--primary': primaryColor } as CSSProperties}>
            <Link href={`/household/${decodedName}`} className={styles.themedBackButton}>&larr; Back</Link>
            <h1 className={styles.pageTitle}>Dishes</h1>
            <p className={styles.note}>To get notifications, subscribe to the ntfy topic: ntfy.sh/{household.id}</p>
            <div className={styles.card}> 
                <ul className={styles.list}>
                    {dishesStatus?.map((dishes, index) => (
                        <li className={styles.item} key={index}>
                            <DishesItem householdId={household.id} status={dishes.status} householdName={decodedName} locked={isDishwasherRunning} />
                        </li>
                    ))}
                </ul>
            
                <form action={addDishwasher} className={styles.form}>
                    <input type="hidden" name="householdId" value={household.id} />
                    <input type="hidden" name="householdName" value={decodedName} />
                    <EndTimePicker />
                    <button type="submit" className={styles.button}>Add</button>
                </form>

                {dishwasherLoads && dishwasherLoads.length > 0 ? (
                    <ul className={styles.list}>
                        {dishwasherLoads.map((load) => (
                            <li key={load.id} className={styles.item}>
                                <DishwasherItem item={load} householdName={decodedName} />
                                <form action={deleteDishwasher}>
                                    <input type="hidden" name="householdId" value={household.id} />
                                    <input type="hidden" name="householdName" value={decodedName} />
                                    <input type="hidden" name="dishwasherId" value={load.id} />
                                    <input type="hidden" name="notificationId" value={load.ntfy_seq_id ?? ''} />
                                    <button type="submit" className={styles.deleteButton}>Delete</button>
                                </form>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className={styles.emptyState}>No active dishwasher loads.</p>
                )}
            </div>
        </div>
    )
} 