import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { addLaundry, deleteLaundry } from './actions'
import EndTimePicker from './EndTimePicker'
import LaundryItem from './LaundryItem'

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
        .select('id')
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

    return (
        <>
            <h1>Laundry</h1>

            <form action={addLaundry}>
                <input type="hidden" name="householdId" value={household.id} />
                <input type="hidden" name="householdName" value={decodedName} />
                <EndTimePicker />
                <button type="submit">Add</button>
            </form>

            {errorMessage && <p>{errorMessage}</p>}

            <ul>
                {laundryLoads?.map((load) => (
                    <li key={load.id} style={{ display: 'flex', gap: '8px' }}>
                        <LaundryItem item={load} householdName={decodedName} />
                        <form action={deleteLaundry} style={{ display: 'inline' }}>
                            <input type="hidden" name="householdId" value={household.id} />
                            <input type="hidden" name="householdName" value={decodedName} />
                            <input type="hidden" name="laundryId" value={load.id} />
                            <input type="hidden" name="notificationId" value={load.ntfy_seq_id} />
                            <button type="submit">Delete</button>
                        </form>
                    </li>
                ))}
            </ul>
        </>
    )
}
