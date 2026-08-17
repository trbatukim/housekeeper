import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import styles from './theme.module.css'
import ColorPicker from './ColorPicker'
import CopyButton from './CopyButton'
import MembersSidebar from './MembersSidebar'

const DEFAULT_COLOR = '#a98bff'

// Background end-color for the page gradient. At DEFAULT_COLOR this
// resolves to exactly #1c1330, matching the default gradient.
const GRADIENT_BASE: [number, number, number] = [28, 19, 48] // #1c1330
const TINT_WEIGHT = 0.18

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function gradientEndColor(primaryColor: string): string {
  const defaultRgb = hexToRgb(DEFAULT_COLOR)
  const primaryRgb = hexToRgb(primaryColor)
  const [r, g, b] = GRADIENT_BASE.map((base, i) =>
    Math.min(255, Math.max(0, Math.round(base + TINT_WEIGHT * (primaryRgb[i] - defaultRgb[i]))))
  )
  return `rgb(${r}, ${g}, ${b})`
}

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
      style={{ '--primary': primaryColor, '--bg-end': gradientEndColor(primaryColor) } as CSSProperties}
    >
      <Link href="/household" className={styles.themedBackButton}>&larr; Back</Link>
      <MembersSidebar members={members} />
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
      </div>
    </div>
  )
}
