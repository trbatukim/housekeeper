import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { addLaundry, deleteLaundry } from './actions'
import EndTimePicker from './EndTimePicker'
import LaundryItem from './LaundryItem'
import styles from '../theme.module.css'

const DEFAULT_COLOR = '#a98bff'

export default async function LaundryPage({
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

    const { data: laundryLoads } = await supabase
        .from('laundry_loads')
        .select('id, ends_at, status, ntfy_seq_id')
        .eq('household_id', household.id)
        .order('created_at')

    const primaryColor = household.primary_color ?? DEFAULT_COLOR

    return (
        <div className={styles.page} style={{ '--primary': primaryColor } as CSSProperties}>
            <Link href={`/household/${decodedName}`} className={styles.backButton}>&larr; Back</Link>
            <h1 className={styles.pageTitle}>Laundry</h1>
            <p className={styles.note}>To get notifications, subscribe to the ntfy topic: ntfy.sh/{household.id}</p>

            <form action={addLaundry} className={styles.form}>
                <input type="hidden" name="householdId" value={household.id} />
                <input type="hidden" name="householdName" value={decodedName} />
                <EndTimePicker />
                <button type="submit" className={styles.button}>Add</button>
            </form>

            {errorMessage && <p className={styles.error}>{errorMessage}</p>}

            <ul className={styles.list}>
                {laundryLoads?.map((load) => (
                    <li key={load.id} className={styles.item}>
                        <LaundryItem item={load} householdName={decodedName} />
                        <form action={deleteLaundry}>
                            <input type="hidden" name="householdId" value={household.id} />
                            <input type="hidden" name="householdName" value={decodedName} />
                            <input type="hidden" name="laundryId" value={load.id} />
                            <input type="hidden" name="notificationId" value={load.ntfy_seq_id ?? ''} />
                            <button type="submit" className={styles.deleteButton}>Delete</button>
                        </form>
                    </li>
                ))}
            </ul>
        </div>
    )
}
