import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

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
    .select('households!inner(id, name)')
    .eq('profile_id', user.id)
    .eq('households.name', decodedName)
    .maybeSingle()

  if (error || !membership) {
    notFound()
  }

  const household = Array.isArray(membership.households)
    ? membership.households[0]
    : membership.households

  return (
    <div>
      <h1>{household.name}</h1>
      <p>Household ID: {household.id}</p> <br></br>
      <Link href={`/household/${household.name}/groceries`}>Groceries</Link>
    </div>
  )
}
