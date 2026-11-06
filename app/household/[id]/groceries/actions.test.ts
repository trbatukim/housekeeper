import { describe, it, expect, vi, beforeEach } from 'vitest'
import { addGroceryItem, editGroceryItem, deleteGrocery, clearGroceryList, clearCheckedGroceries, toggleGrocery } from './actions'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { mockSupabaseClient, formData } from '@/lib/supabase/testing'
import { addGrocery, updateGrocery, clearAllGroceries, clearPurchasedGroceries } from '@/services/grocery-service'
import { deleteById } from '@/repositories/grocery-repository'
import { ValidationError } from '@/core/errors/validation.error'
import { DuplicateError } from '@/core/errors/conflict.error'
import { DatabaseError } from '@/core/errors/database.error'
import { NotFoundError } from '@/core/errors/not-found.error'

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

vi.mock('next/navigation', () => ({
    redirect: vi.fn(() => { throw new Error('NEXT_REDIRECT') }),
}))

vi.mock('@/services/grocery-service', () => ({
    addGrocery: vi.fn(),
    updateGrocery: vi.fn(),
    clearAllGroceries: vi.fn(),
    clearPurchasedGroceries: vi.fn(),
}))

vi.mock('@/repositories/grocery-repository', () => ({
    deleteById: vi.fn(),
}))

const groceriesPath = '/household/h1/groceries'

function signIn(user: { id: string } | null = { id: 'u1' }) {
    const supabase = mockSupabaseClient({ user })
    vi.mocked(createClient).mockResolvedValue(supabase as never)
    return supabase
}

describe('addGroceryItem', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('does nothing when there is no authenticated user', async () => {
        signIn(null)

        await addGroceryItem(formData({ householdId: 'h1', name: 'Milk' }))

        expect(addGrocery).not.toHaveBeenCalled()
        expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('adds the parsed item and revalidates on success', async () => {
        const supabase = signIn()

        await addGroceryItem(formData({ householdId: 'h1', name: '  Milk  ', amount: '2', amountType: 'kg' }))

        expect(addGrocery).toHaveBeenCalledWith(supabase, 'h1', 'u1', { name: 'Milk', amount: 2, amountType: 'kg' })
        expect(revalidatePath).toHaveBeenCalledWith(groceriesPath)
    })

    it('uses the custom unit when "Other" is selected', async () => {
        signIn()

        await addGroceryItem(formData({ householdId: 'h1', name: 'Milk', amount: '2', amountType: '__custom', customAmountType: ' bottles ' }))

        expect(addGrocery).toHaveBeenCalledWith(expect.anything(), 'h1', 'u1', { name: 'Milk', amount: 2, amountType: 'bottles' })
    })

    it.each([
        new ValidationError('Amount must be a number'),
        new DuplicateError('"Milk" is already on the list.'),
        new DatabaseError('Database add query failed'),
    ])('redirects with the message when the service throws $name', async (error) => {
        signIn()
        vi.mocked(addGrocery).mockRejectedValueOnce(error)

        await expect(addGroceryItem(formData({ householdId: 'h1', name: 'Milk', amount: '2', amountType: 'kg' })))
            .rejects.toThrow('NEXT_REDIRECT')

        expect(redirect).toHaveBeenCalledWith(`${groceriesPath}?error=${encodeURIComponent(error.message)}`)
        expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('rethrows errors that are not AppErrors', async () => {
        signIn()
        const error = new Error('unexpected')
        vi.mocked(addGrocery).mockRejectedValueOnce(error)

        await expect(addGroceryItem(formData({ householdId: 'h1', name: 'Milk', amount: '2', amountType: 'kg' })))
            .rejects.toBe(error)

        expect(redirect).not.toHaveBeenCalled()
        expect(revalidatePath).not.toHaveBeenCalled()
    })
})

describe('editGroceryItem', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('does nothing when there is no authenticated user', async () => {
        signIn(null)

        await editGroceryItem(formData({ householdId: 'h1', itemId: 'i1', name: 'Milk' }))

        expect(updateGrocery).not.toHaveBeenCalled()
        expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('updates the parsed item and revalidates on success', async () => {
        const supabase = signIn()

        await editGroceryItem(formData({ householdId: 'h1', itemId: 'i1', name: ' Oat milk ', amount: '3', amountType: 'l' }))

        expect(updateGrocery).toHaveBeenCalledWith(supabase, 'i1', 'h1', { name: 'Oat milk', amount: 3, amountType: 'l' })
        expect(revalidatePath).toHaveBeenCalledWith(groceriesPath)
    })

    it('redirects with the message when the service throws an AppError', async () => {
        signIn()
        vi.mocked(updateGrocery).mockRejectedValueOnce(new NotFoundError("Item you're trying to edit does not exist"))

        await expect(editGroceryItem(formData({ householdId: 'h1', itemId: 'i1', name: 'Milk', amount: '2', amountType: 'kg' })))
            .rejects.toThrow('NEXT_REDIRECT')

        expect(redirect).toHaveBeenCalledWith(`${groceriesPath}?error=${encodeURIComponent("Item you're trying to edit does not exist")}`)
        expect(revalidatePath).not.toHaveBeenCalled()
    })
})

describe('clearGroceryList', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('does nothing when there is no authenticated user', async () => {
        signIn(null)

        await clearGroceryList(formData({ householdId: 'h1' }))

        expect(clearAllGroceries).not.toHaveBeenCalled()
        expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('clears the household list and revalidates on success', async () => {
        const supabase = signIn()

        await clearGroceryList(formData({ householdId: 'h1' }))

        expect(clearAllGroceries).toHaveBeenCalledWith(supabase, 'h1')
        expect(revalidatePath).toHaveBeenCalledWith(groceriesPath)
    })

    it('redirects with the message when the service throws an AppError', async () => {
        signIn()
        vi.mocked(clearAllGroceries).mockRejectedValueOnce(new DatabaseError('Database delete all query failed'))

        await expect(clearGroceryList(formData({ householdId: 'h1' }))).rejects.toThrow('NEXT_REDIRECT')

        expect(redirect).toHaveBeenCalledWith(`${groceriesPath}?error=${encodeURIComponent('Database delete all query failed')}`)
        expect(revalidatePath).not.toHaveBeenCalled()
    })
})

describe('clearCheckedGroceries', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('clears purchased items and revalidates on success', async () => {
        const supabase = signIn()

        await clearCheckedGroceries(formData({ householdId: 'h1' }))

        expect(clearPurchasedGroceries).toHaveBeenCalledWith(supabase, 'h1')
        expect(revalidatePath).toHaveBeenCalledWith(groceriesPath)
    })

    it('redirects with the message when the service throws an AppError', async () => {
        signIn()
        vi.mocked(clearPurchasedGroceries).mockRejectedValueOnce(new DatabaseError('Database clear purchased query failed'))

        await expect(clearCheckedGroceries(formData({ householdId: 'h1' }))).rejects.toThrow('NEXT_REDIRECT')

        expect(redirect).toHaveBeenCalledWith(`${groceriesPath}?error=${encodeURIComponent('Database clear purchased query failed')}`)
        expect(revalidatePath).not.toHaveBeenCalled()
    })
})

describe('deleteGrocery', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('does nothing when there is no authenticated user', async () => {
        signIn(null)

        await deleteGrocery(formData({ householdId: 'h1', itemId: 'i1' }))

        expect(deleteById).not.toHaveBeenCalled()
        expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('deletes the item and revalidates on success', async () => {
        const supabase = signIn()

        await deleteGrocery(formData({ householdId: 'h1', itemId: 'i1' }))

        expect(deleteById).toHaveBeenCalledWith(supabase, 'i1', 'h1')
        expect(revalidatePath).toHaveBeenCalledWith(groceriesPath)
    })

    it('redirects with the message when the delete throws an AppError', async () => {
        signIn()
        vi.mocked(deleteById).mockRejectedValueOnce(new DatabaseError('Database delete query failed'))

        await expect(deleteGrocery(formData({ householdId: 'h1', itemId: 'i1' }))).rejects.toThrow('NEXT_REDIRECT')

        expect(redirect).toHaveBeenCalledWith(`${groceriesPath}?error=${encodeURIComponent('Database delete query failed')}`)
        expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('rethrows errors that are not AppErrors', async () => {
        signIn()
        const error = new Error('unexpected')
        vi.mocked(deleteById).mockRejectedValueOnce(error)

        await expect(deleteGrocery(formData({ householdId: 'h1', itemId: 'i1' }))).rejects.toBe(error)

        expect(revalidatePath).not.toHaveBeenCalled()
    })
})

describe('toggleGrocery', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('updates the purchased status and revalidates', async () => {
        const supabase = signIn()

        await toggleGrocery('i1', true, 'h1')

        expect(updateGrocery).toHaveBeenCalledWith(supabase, 'i1', 'h1', { isPurchased: true })
        expect(revalidatePath).toHaveBeenCalledWith(groceriesPath)
    })

    it('redirects with the message when the update throws an AppError', async () => {
        signIn()
        vi.mocked(updateGrocery).mockRejectedValueOnce(new NotFoundError("Item you're trying to edit does not exist"))

        await expect(toggleGrocery('i1', false, 'h1')).rejects.toThrow('NEXT_REDIRECT')

        expect(redirect).toHaveBeenCalledWith(`${groceriesPath}?error=${encodeURIComponent("Item you're trying to edit does not exist")}`)
        expect(revalidatePath).not.toHaveBeenCalled()
    })
})
