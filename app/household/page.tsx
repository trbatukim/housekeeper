import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Households() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('./login')
  }

  const { data: memberships, error } = await supabase
    .from('profiles_to_households')
    .select('households(id, name)')
    .eq('profile_id', user.id)

  if (error) {
    return (
      <div>
        <p>Failed to load households: {error.message}</p>
      </div>
    )
  }

  const households = memberships.flatMap((m) => m.households)

  return (
    <div>
      <h1>Your households</h1>
      {households.length === 0 ? (
        <p>You haven&apos;t joined any households yet.</p>
      ) : (
        <ul>
          {households.map((household) => (
            <li key={household.id}>
              <Link href={`/household/${encodeURIComponent(household.name)}`}>
                {household.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}