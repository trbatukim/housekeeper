import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'

export default async function Groceries({
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

    const { data: household } = await supabase
        .from('households')
        .select('id')
        .eq('name', decodedName)
        .maybeSingle()

    if (!household) {
        notFound()
    }

    const { data: groceries, error } = await supabase
        .from('grocery_items')
        .select('id, name, is_purchased')
        .eq('household_id', household.id)
        .order('created_at')

    return (
        <ul>
            {groceries?.map((item) => (
                <li key={item.id}>{item.name}</li>
            ))}
        </ul>
    )
}