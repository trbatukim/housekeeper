import styles from '../../theme.module.css'
import type { Metadata } from "next";
import { NAME_MAX_LENGTH } from '@/lib/textLimits'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import HouseholdThemeSync from '../../../../HouseholdThemeSync'
import { addMeal, deleteMeal } from './actions'

const DEFAULT_COLOR = '#a98bff'

export default async function Meals({
    params,
    searchParams,
}:{
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

    const primaryColor = household.primary_color ?? DEFAULT_COLOR
    
    return (
        <div className={styles.page} style={{ '--primary': primaryColor } as CSSProperties}>
            <HouseholdThemeSync color={primaryColor} />
            <Link href={`/household/${household.id}/meal-planner`} className={styles.themedBackButton}>&larr; Back</Link>
            <h1 className={styles.pageTitle}>Meals</h1>
        </div>
    )
}