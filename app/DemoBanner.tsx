import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DemoBanner() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.is_anonymous) return null

    return (
        <div className="demoBanner">
            You&apos;re exploring a demo. <Link href="/signup">Sign up</Link>
        </div>
    )
}
