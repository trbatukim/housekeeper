import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import styles from './theme.module.css'
import ColorPicker from './ColorPicker'

const DEFAULT_COLOR = '#a98bff'

export default async function HouseholdPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name } = await params
  const decodedName = decodeURIComponent(name)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: membership, error } = await supabase
    .from('profiles_to_households')
    .select('households!inner(id, name, primary_color)')
    .eq('profile_id', user.id)
    .eq('households.name', decodedName)
    .maybeSingle()

  if (error || !membership) {
    notFound()
  }

  const household = Array.isArray(membership.households)
    ? membership.households[0]
    : membership.households

  const primaryColor = household.primary_color ?? DEFAULT_COLOR

  return (
    <div className={styles.page} style={{ '--primary': primaryColor } as CSSProperties}>
      <Link href="/household" className={styles.backButton}>&larr; Back</Link>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>{household.name}</h1>
          <span className={styles.idBadge}>ID: {household.id}</span>
        </div>
        <nav className={styles.nav}>
          <Link href={`/household/${household.name}/groceries`} className={styles.navLink}>
            Groceries
          </Link>
          <Link href={`/household/${household.name}/expenses`} className={styles.navLink}>
            Expenses
          </Link>
          <Link href={`/household/${household.name}/laundry`} className={styles.navLink}>
            Laundry
          </Link>
        </nav>
        <ColorPicker householdId={household.id} householdName={household.name} color={primaryColor} />
      </div>
    </div>
  )
}
