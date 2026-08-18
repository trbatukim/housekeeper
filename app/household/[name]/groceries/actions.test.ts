import { describe, it, expect, vi, beforeEach } from 'vitest'
import { addGroceryItem, deleteGrocery, clearGroceryList, toggleGrocery } from './actions'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { mockSupabaseClient, mockQueryBuilder, queryResult, formData } from '@/lib/supabase/testing'

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

describe('addGroceryItem', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('does nothing when there is no authenticated user', async () => {
        const supabase = mockSupabaseClient({ user: null })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await addGroceryItem(formData({
            householdId: 'h1',
            householdName: 'name',
            name: 'Milk'
        }))

        expect(supabase.from).not.toHaveBeenCalled()
        expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('redirects with an error when amount or unit is missing', async () => {
        const groceryItems = mockQueryBuilder(queryResult(null))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { grocery_items: groceryItems } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(addGroceryItem(formData({
            householdId: 'h1',
            householdName: 'name',
            name: 'Milk'
        }))).rejects.toThrow('NEXT_REDIRECT')

        expect(groceryItems.insert).not.toHaveBeenCalled()
        expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('redirects with an error when amount is not a number', async () => {
        const groceryItems = mockQueryBuilder(queryResult(null))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { grocery_items: groceryItems } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(addGroceryItem(formData({
            householdId: 'h1',
            householdName: 'name',
            name: 'Milk',
            amount: 'not-a-number',
            amountType: 'kg'
        }))).rejects.toThrow('NEXT_REDIRECT')

        expect(groceryItems.insert).not.toHaveBeenCalled()
        expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('redirects with an error when a custom unit is selected but left blank', async () => {
        const groceryItems = mockQueryBuilder(queryResult(null))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { grocery_items: groceryItems } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(addGroceryItem(formData({
            householdId: 'h1',
            householdName: 'name',
            name: 'Milk',
            amount: '2',
            amountType: '__custom'
        }))).rejects.toThrow('NEXT_REDIRECT')

        expect(groceryItems.insert).not.toHaveBeenCalled()
        expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('redirects with an error when the item is already on the list', async () => {
        const groceryItems = mockQueryBuilder(queryResult({ id: 'existing' }))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { grocery_items: groceryItems } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(addGroceryItem(formData({
            householdId: 'h1',
            householdName: 'name',
            name: 'Milk',
            amount: '2',
            amountType: 'kg'
        }))).rejects.toThrow('NEXT_REDIRECT')

        expect(groceryItems.insert).not.toHaveBeenCalled()
        expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('redirects with an error when the insert fails', async () => {
        const groceryItems = mockQueryBuilder(queryResult(null, { message: 'boom' }))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { grocery_items: groceryItems } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(addGroceryItem(formData({
            householdId: 'h1',
            householdName: 'name',
            name: 'Milk',
            amount: '2',
            amountType: 'kg'
        }))).rejects.toThrow('NEXT_REDIRECT')

        expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('inserts the item and revalidates on success', async () => {
        const groceryItems = mockQueryBuilder(queryResult(null))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { grocery_items: groceryItems } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await addGroceryItem(formData({
            householdId: 'h1',
            householdName: 'name',
            name: 'Milk',
            amount: '2',
            amountType: 'kg'
        }))

        expect(groceryItems.eq).toHaveBeenCalledWith('household_id', 'h1')
        expect(groceryItems.ilike).toHaveBeenCalledWith('name', 'Milk')
        expect(groceryItems.insert).toHaveBeenCalledWith({ household_id: 'h1', name: 'Milk', added_by: 'u1', amount: 2, amount_type: 'kg' })
        expect(revalidatePath).toHaveBeenCalledWith('/household/name/groceries')
    })

    it('uses the custom unit when "Other" is selected', async () => {
        const groceryItems = mockQueryBuilder(queryResult(null))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { grocery_items: groceryItems } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await addGroceryItem(formData({
            householdId: 'h1',
            householdName: 'name',
            name: 'Milk',
            amount: '2',
            amountType: '__custom',
            customAmountType: 'bottles'
        }))

        expect(groceryItems.insert).toHaveBeenCalledWith({ household_id: 'h1', name: 'Milk', added_by: 'u1', amount: 2, amount_type: 'bottles' })
    })

    it('trims whitespace from the item name', async () => {
        const groceryItems = mockQueryBuilder(queryResult(null))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { grocery_items: groceryItems } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await addGroceryItem(formData({
            householdId: 'h1',
            householdName: 'name',
            name: '  Milk  ',
            amount: '2',
            amountType: 'kg'
        }))

        expect(groceryItems.insert).toHaveBeenCalledWith({ household_id: 'h1', name: 'Milk', added_by: 'u1', amount: 2, amount_type: 'kg' })
    })
})

describe('clearGroceryList', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('does nothing when there is no authenticated user', async () => {
        const supabase = mockSupabaseClient({ user: null })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await clearGroceryList(formData({ householdId: 'h1', householdName: 'name' }))

        expect(supabase.from).not.toHaveBeenCalled()
        expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('redirects with an error when the delete fails', async () => {
        const groceryItems = mockQueryBuilder(queryResult(null, { message: 'boom' }))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { grocery_items: groceryItems } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(clearGroceryList(formData({ householdId: 'h1', householdName: 'name' })))
            .rejects.toThrow('NEXT_REDIRECT')

        expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('deletes all household items and revalidates on success', async () => {
        const groceryItems = mockQueryBuilder(queryResult(null))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { grocery_items: groceryItems } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await clearGroceryList(formData({ householdId: 'h1', householdName: 'name' }))

        expect(groceryItems.delete).toHaveBeenCalled()
        expect(groceryItems.eq).toHaveBeenCalledWith('household_id', 'h1')
        expect(revalidatePath).toHaveBeenCalledWith('/household/name/groceries')
    })
})

describe('deleteGrocery', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('does nothing when there is no authenticated user', async () => {
        const supabase = mockSupabaseClient({ user: null })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await deleteGrocery(formData({ householdId: 'h1', householdName: 'name', itemId: 'i1' }))

        expect(supabase.from).not.toHaveBeenCalled()
        expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('redirects with an error when the delete fails', async () => {
        const groceryItems = mockQueryBuilder(queryResult(null, { message: 'boom' }))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { grocery_items: groceryItems } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(deleteGrocery(formData({ householdId: 'h1', householdName: 'name', itemId: 'i1' })))
            .rejects.toThrow('NEXT_REDIRECT')

        expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('deletes the item and revalidates on success', async () => {
        const groceryItems = mockQueryBuilder(queryResult(null))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { grocery_items: groceryItems } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await deleteGrocery(formData({ householdId: 'h1', householdName: 'name', itemId: 'i1' }))

        expect(groceryItems.delete).toHaveBeenCalled()
        expect(groceryItems.eq).toHaveBeenCalledWith('household_id', 'h1')
        expect(groceryItems.eq).toHaveBeenCalledWith('id', 'i1')
        expect(revalidatePath).toHaveBeenCalledWith('/household/name/groceries')
    })
})

describe('toggleGrocery', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('updates the purchased status and revalidates', async () => {
        const groceryItems = mockQueryBuilder(queryResult(null))
        const supabase = mockSupabaseClient({ from: { grocery_items: groceryItems } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await toggleGrocery('i1', true, 'name')

        expect(groceryItems.update).toHaveBeenCalledWith({ is_purchased: true })
        expect(groceryItems.eq).toHaveBeenCalledWith('id', 'i1')
        expect(revalidatePath).toHaveBeenCalledWith('/household/name/groceries')
    })

    it('still revalidates when the update fails', async () => {
        const groceryItems = mockQueryBuilder(queryResult(null, { message: 'boom' }))
        const supabase = mockSupabaseClient({ from: { grocery_items: groceryItems } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)
        vi.spyOn(console, 'error').mockImplementation(() => {})

        await toggleGrocery('i1', false, 'name')

        expect(revalidatePath).toHaveBeenCalledWith('/household/name/groceries')
    })
})
