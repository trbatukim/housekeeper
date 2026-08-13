import styles from '../theme.module.css'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import DishesItem from './DishesItem'

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

    const primaryColor = household.primary_color ?? DEFAULT_COLOR

    return (
        <div className={styles.page} style={{ '--primary': primaryColor } as CSSProperties}>
            <Link href={`/household/${decodedName}`} className={styles.backButton}>&larr; Back</Link>
            <h1 className={styles.title}>Dishes</h1>
            <p className={styles.note}>To get notifications, subscribe to the ntfy topic: ntfy.sh/{household.id}</p>

            <ul className={styles.list}>
                {dishesStatus?.map((dishes, index) => (
                    <li className={styles.item} key={index}>
                        <DishesItem householdId={household.id} status={dishes.status} householdName={decodedName} />
                    </li>
                ))}
            </ul>
        </div>
    )
} 