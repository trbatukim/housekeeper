import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SupabaseClient } from '@supabase/supabase-js'
import { addGrocery, updateGrocery, clearAllGroceries, clearPurchasedGroceries, deleteGroceryById, deleteGroceryByName } from './grocery-service'
import { mockSupabaseClient, mockQueryBuilder, queryResult } from '@/lib/supabase/testing'
import { ValidationError } from '@/core/errors/validation.error'
import { DuplicateError } from '@/core/errors/conflict.error'
import { NotFoundError } from '@/core/errors/not-found.error'
import { DatabaseError } from '@/core/errors/database.error'

function setup(result: ReturnType<typeof queryResult>) {
    const groceryItems = mockQueryBuilder(result)
    const supabase = mockSupabaseClient({ from: { grocery_items: groceryItems } })
    return { groceryItems, supabase, db: supabase as unknown as SupabaseClient }
}

const validInput = { name: 'Milk', amount: 2, amountType: 'kg' }

describe('addGrocery', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    it.each([
        ['the name is empty', { ...validInput, name: '' }],
        ['the name is too long', { ...validInput, name: 'a'.repeat(1000) }],
        ['the amount is not a number', { ...validInput, amount: NaN }],
        ['the amount is not finite', { ...validInput, amount: Infinity }],
        ['the amount is zero', { ...validInput, amount: 0 }],
        ['the amount type is missing', { ...validInput, amountType: null }],
    ])('throws a ValidationError without touching the database when %s', async (_, input) => {
        const { supabase, db } = setup(queryResult([]))

        await expect(addGrocery(db, 'h1', 'u1', input)).rejects.toThrow(ValidationError)

        expect(supabase.from).not.toHaveBeenCalled()
    })

    it('throws a DuplicateError when the name is already on the list, ignoring case', async () => {
        const { groceryItems, db } = setup(queryResult([{ name: 'milk' }]))

        await expect(addGrocery(db, 'h1', 'u1', validInput)).rejects.toThrow(DuplicateError)

        expect(groceryItems.insert).not.toHaveBeenCalled()
    })

    it('throws a DatabaseError when the query fails', async () => {
        const { db } = setup(queryResult(null, { message: 'boom' }))

        await expect(addGrocery(db, 'h1', 'u1', validInput)).rejects.toThrow(DatabaseError)
    })

    it('inserts the item for the household', async () => {
        const { groceryItems, db } = setup(queryResult([]))

        await addGrocery(db, 'h1', 'u1', validInput)

        expect(groceryItems.eq).toHaveBeenCalledWith('household_id', 'h1')
        expect(groceryItems.insert).toHaveBeenCalledWith({ household_id: 'h1', name: 'Milk', added_by: 'u1', amount: 2, amount_type: 'kg' })
    })
})

describe('updateGrocery', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    it('throws a ValidationError when nothing is being updated', async () => {
        const { supabase, db } = setup(queryResult(null))

        await expect(updateGrocery(db, 'i1', 'h1', {})).rejects.toThrow(ValidationError)

        expect(supabase.from).not.toHaveBeenCalled()
    })

    it('throws a ValidationError when a field is invalid', async () => {
        const { supabase, db } = setup(queryResult(null))

        await expect(updateGrocery(db, 'i1', 'h1', { amount: NaN })).rejects.toThrow(ValidationError)

        expect(supabase.from).not.toHaveBeenCalled()
    })

    it('throws a DuplicateError when renaming to a name another item has', async () => {
        const { groceryItems, db } = setup(queryResult([{ name: 'Eggs' }]))

        await expect(updateGrocery(db, 'i1', 'h1', { name: 'eggs' })).rejects.toThrow(DuplicateError)

        expect(groceryItems.neq).toHaveBeenCalledWith('id', 'i1')
        expect(groceryItems.update).not.toHaveBeenCalled()
    })

    it('throws a NotFoundError when the item does not exist', async () => {
        const { db } = setup(queryResult(null))

        await expect(updateGrocery(db, 'i1', 'h1', { isPurchased: true })).rejects.toThrow(NotFoundError)
    })

    it('throws a DatabaseError when the update fails', async () => {
        const { db } = setup(queryResult(null, { message: 'boom' }))

        await expect(updateGrocery(db, 'i1', 'h1', { isPurchased: true })).rejects.toThrow(DatabaseError)
    })

    it('updates only the purchased status and returns the row', async () => {
        const row = { id: 'i1', name: 'Milk', is_purchased: true }
        const { groceryItems, db } = setup(queryResult(row))

        await expect(updateGrocery(db, 'i1', 'h1', { isPurchased: true })).resolves.toEqual(row)

        expect(groceryItems.update).toHaveBeenCalledWith({ is_purchased: true })
        expect(groceryItems.eq).toHaveBeenCalledWith('id', 'i1')
        expect(groceryItems.eq).toHaveBeenCalledWith('household_id', 'h1')
    })
})

describe('clearAllGroceries', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    it('throws a DatabaseError when the delete fails', async () => {
        const { db } = setup(queryResult(null, { message: 'boom' }))

        await expect(clearAllGroceries(db, 'h1')).rejects.toThrow(DatabaseError)
    })

    it('deletes every item in the household', async () => {
        const { groceryItems, db } = setup(queryResult(null))

        await clearAllGroceries(db, 'h1')

        expect(groceryItems.delete).toHaveBeenCalled()
        expect(groceryItems.eq).toHaveBeenCalledWith('household_id', 'h1')
    })
})

describe('clearPurchasedGroceries', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    it('throws a DatabaseError when the delete fails', async () => {
        const { db } = setup(queryResult(null, { message: 'boom' }))

        await expect(clearPurchasedGroceries(db, 'h1')).rejects.toThrow(DatabaseError)
    })

    it('deletes only purchased items in the household', async () => {
        const { groceryItems, db } = setup(queryResult(null))

        await clearPurchasedGroceries(db, 'h1')

        expect(groceryItems.delete).toHaveBeenCalled()
        expect(groceryItems.eq).toHaveBeenCalledWith('household_id', 'h1')
        expect(groceryItems.eq).toHaveBeenCalledWith('is_purchased', true)
    })
})

describe('deleteGroceryById', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    it('throws a DatabaseError when the delete fails', async () => {
        const { db } = setup(queryResult(null, { message: 'boom' }))

        await expect(deleteGroceryById(db, 'i1', 'h1')).rejects.toThrow(DatabaseError)
    })

    it('deletes the item in the household and returns the deleted rows', async () => {
        const row = { id: 'i1', name: 'Milk' }
        const { groceryItems, db } = setup(queryResult([row]))

        await expect(deleteGroceryById(db, 'i1', 'h1')).resolves.toEqual([row])

        expect(groceryItems.delete).toHaveBeenCalled()
        expect(groceryItems.eq).toHaveBeenCalledWith('id', 'i1')
        expect(groceryItems.eq).toHaveBeenCalledWith('household_id', 'h1')
    })

    it('returns an empty array when nothing matched', async () => {
        const { db } = setup(queryResult([]))

        await expect(deleteGroceryById(db, 'i1', 'h1')).resolves.toEqual([])
    })
})

describe('deleteGroceryByName', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    it('throws a DatabaseError when the delete fails', async () => {
        const { db } = setup(queryResult(null, { message: 'boom' }))

        await expect(deleteGroceryByName(db, 'Milk', 'h1')).rejects.toThrow(DatabaseError)
    })

    it('deletes by exact name in the household and returns the deleted rows', async () => {
        const row = { id: 'i1', name: 'Milk' }
        const { groceryItems, db } = setup(queryResult([row]))

        await expect(deleteGroceryByName(db, 'Milk', 'h1')).resolves.toEqual([row])

        expect(groceryItems.delete).toHaveBeenCalled()
        expect(groceryItems.eq).toHaveBeenCalledWith('name', 'Milk')
        expect(groceryItems.eq).toHaveBeenCalledWith('household_id', 'h1')
    })
})
