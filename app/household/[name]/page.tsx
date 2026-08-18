import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import styles from './theme.module.css'
import ColorPicker from './ColorPicker'
import CopyButton from './CopyButton'
import MembersSidebar from './MembersSidebar'
import type { Metadata } from "next";

const DEFAULT_COLOR = '#a98bff'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>
}): Promise<Metadata> {
  const { name } = await params
  return {
    title: decodeURIComponent(name),
  }
}

export default async function HouseholdPage({
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
  const isBlackTheme = primaryColor.toLowerCase() === '#000000'

  const { data: memberRows } = await supabase
    .from('profiles_to_households')
    .select('profiles(id, name)')
    .eq('household_id', household.id)

  const members = (memberRows ?? []).map((row) =>
    Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
  ).filter((profile): profile is { id: string; name: string } => Boolean(profile))

  return (
    <div
      className={styles.page}
      style={{ '--primary': primaryColor } as CSSProperties}
    >
      <Link href="/household" className={styles.themedBackButton}>&larr; Back</Link>
      <div className={styles.topRightButtons}>
        <MembersSidebar members={members} />
      </div>
      <div
        className={styles.card}
        style={
          isBlackTheme
            ? { background: 'rgba(255, 255, 255, 0.08)', borderColor: 'rgba(255, 255, 255, 0.18)' }
            : undefined
        }
      >
        <div className={styles.header}>
          <h1 className={styles.themedTitle}>{household.name}</h1>

          <div className={styles.idBadgeContainer}>
            <span className={styles.idBadge}>ID: {household.id}</span>
            <CopyButton text={household.id} />
          </div>

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
          <Link href={`/household/${household.name}/dishes`} className={styles.navLink}>
            Dishes
          </Link>
        </nav>
        <ColorPicker householdId={household.id} householdName={household.name} color={primaryColor} />
        {errorMessage && <p className="error">{errorMessage}</p>}
      </div>
    </div>
  )
}
