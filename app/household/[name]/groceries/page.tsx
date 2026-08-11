import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { addGroceryItem, clearGroceryList, deleteGrocery, toggleGrocery } from './actions'
import GroceryItem from './GroceryItem'

export default async function Groceries({
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

    const { data: groceries, error } = await supabase
        .from('grocery_items')
        .select('id, name, is_purchased')
        .eq('household_id', household.id)
        .order('created_at')

    return (
        <>
            <form action={addGroceryItem}>
                <input type="hidden" name="householdId" value={household.id} />
                <input type="hidden" name="householdName" value={decodedName} />
                <input type="text" name="name" placeholder="Add an item" required />
                <button type="submit">Add</button>
            </form>

            {errorMessage && <p>{errorMessage}</p>}

            <form action={clearGroceryList}>
                <input type="hidden" name="householdId" value={household.id} />
                <input type="hidden" name="householdName" value={decodedName} />
                <button type="submit">Clear list</button>
            </form>

            <ul>
                {groceries?.map((item) => (
                    <li key={item.id} style={{ display: 'flex', gap: '8px' }}>
                        <GroceryItem item={item} householdName={decodedName} />
                        <form action={deleteGrocery} style={{ display: 'inline' }}>
                            <input type="hidden" name="householdId" value={household.id} />
                            <input type="hidden" name="householdName" value={decodedName} />
                            <input type="hidden" name="itemId" value={item.id} />
                            <button type="submit">Delete</button>
                        </form>
                    </li>
                ))}
            </ul>
        </>
    )
}