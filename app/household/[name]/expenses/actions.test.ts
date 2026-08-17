import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { addExpense, deleteExpense, rolloverRecurringExpenses, toggleExpense } from './actions'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { mockSupabaseClient, mockQueryBuilder, queryResult, formData } from '@/lib/supabase/testing'

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

describe('addExpense', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('does nothing when there is no authenticated user', async () => {
        const supabase = mockSupabaseClient({ user: null })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await addExpense(formData({
            householdId: 'h1',
            householdName: 'name',
            description: 'description',
            amount: '0.01',
            category: 'one-time',
            paidOn: '2026-07-29'
        }))

        expect(supabase.from).not.toHaveBeenCalled()
        expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('redirects with an error when there is already on an expense with the same description', async () => {
        const expenses = mockQueryBuilder(queryResult({ description: 'description' }))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { expenses: expenses } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(addExpense(formData({
            householdId: 'h1',
            householdName: 'name',
            description: 'description',
            amount: '0.01',
            category: 'one-time',
            paidOn: '2026-07-29'
        }))).rejects.toThrow('NEXT_REDIRECT')

        expect(expenses.insert).not.toHaveBeenCalled()
        expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('does not revalidate when the insert fails', async () => {
        const expenses = mockQueryBuilder(queryResult(null, { message: 'boom' }))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { expenses: expenses } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)
        vi.spyOn(console, 'error').mockImplementation(() => {})

        await expect(addExpense(formData({
            householdId: 'h1',
            householdName: 'name',
            description: 'description',
            amount: '0.01',
            category: 'one-time',
            paidOn: '2026-07-29'
        }))).rejects.toThrow('NEXT_REDIRECT')

        expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('inserts expense and revalidates on success', async () => {
        const expenses = mockQueryBuilder(queryResult(null))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { expenses: expenses } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await addExpense(formData({
            householdId: 'h1',
            householdName: 'name',
            description: 'description',
            amount: '0.01',
            category: 'one-time',
            paidOn: '2026-07-29'
        }))

        expect(expenses.eq).toHaveBeenCalledWith('household_id', 'h1')
        expect(expenses.ilike).toHaveBeenCalledWith('description', 'description')
        expect(expenses.insert).toHaveBeenCalledWith({ 
            household_id: 'h1',
            description: 'description',
            amount: 0.01,
            category: 'one-time',
            paid_on: '2026-07-29' 
        })
        expect(revalidatePath).toHaveBeenCalledWith('/household/name/expenses')
    })

    it('trims whitespace from expense description', async () => {
        const expenses = mockQueryBuilder(queryResult(null))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { expenses: expenses } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await addExpense(formData({
            householdId: 'h1',
            householdName: 'name',
            description: '    description    ',
            amount: '0.01',
            category: 'one-time',
            paidOn: '2026-07-29'
        }))

        expect(expenses.insert).toHaveBeenCalledWith({
            household_id: 'h1',
            description: 'description',
            amount: 0.01,
            category: 'one-time',
            paid_on: '2026-07-29'
        })
    })

    it('redirects with an error when the description is blank', async () => {
        const supabase = mockSupabaseClient({ user: { id: 'u1' } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(addExpense(formData({
            householdId: 'h1',
            householdName: 'name',
            description: '    ',
            amount: '0.01',
            category: 'one-time',
            paidOn: '2026-07-29'
        }))).rejects.toThrow('NEXT_REDIRECT')

        expect(supabase.from).not.toHaveBeenCalled()
    })

    it('redirects with an error when the amount is not a number', async () => {
        const supabase = mockSupabaseClient({ user: { id: 'u1' } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(addExpense(formData({
            householdId: 'h1',
            householdName: 'name',
            description: 'description',
            amount: 'not a number',
            category: 'one-time',
            paidOn: '2026-07-29'
        }))).rejects.toThrow('NEXT_REDIRECT')

        expect(supabase.from).not.toHaveBeenCalled()
    })

    it('redirects with an error when the amount is not positive', async () => {
        const supabase = mockSupabaseClient({ user: { id: 'u1' } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(addExpense(formData({
            householdId: 'h1',
            householdName: 'name',
            description: 'description',
            amount: '0',
            category: 'one-time',
            paidOn: '2026-07-29'
        }))).rejects.toThrow('NEXT_REDIRECT')

        expect(supabase.from).not.toHaveBeenCalled()
    })

    it('redirects with an error when the category is invalid', async () => {
        const supabase = mockSupabaseClient({ user: { id: 'u1' } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(addExpense(formData({
            householdId: 'h1',
            householdName: 'name',
            description: 'description',
            amount: '0.01',
            category: 'not-a-category',
            paidOn: '2026-07-29'
        }))).rejects.toThrow('NEXT_REDIRECT')

        expect(supabase.from).not.toHaveBeenCalled()
    })

    it('defaults paid_on to today when it is not provided', async () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-08-15T00:00:00.000Z'))

        const expenses = mockQueryBuilder(queryResult(null))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { expenses: expenses } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await addExpense(formData({
            householdId: 'h1',
            householdName: 'name',
            description: 'description',
            amount: '0.01',
            category: 'one-time'
        }))

        expect(expenses.eq).toHaveBeenCalledWith('paid_on', '2026-08-15')
        expect(expenses.insert).toHaveBeenCalledWith({
            household_id: 'h1',
            description: 'description',
            amount: 0.01,
            category: 'one-time',
        })

        vi.useRealTimers()
    })
})

describe('deleteExpense', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('does nothing when there is no authenticated user', async () => {
        const supabase = mockSupabaseClient({ user: null })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await deleteExpense(formData({
            householdId: 'h1',
            householdName: 'name',
            expenseId: 'e1'
        }))

        expect(supabase.from).not.toHaveBeenCalled()
        expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('redirects with an error when the delete fails', async () => {
        const expenses = mockQueryBuilder(queryResult(null, { message: 'boom' }))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { expenses: expenses } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(deleteExpense(formData({
            householdId: 'h1',
            householdName: 'name',
            expenseId: 'e1'
        }))).rejects.toThrow('NEXT_REDIRECT')

        expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('deletes the item and revalidates on success', async () => {
        const expenses = mockQueryBuilder(queryResult(null))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { expenses: expenses } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await deleteExpense(formData({
            householdId: 'h1',
            householdName: 'name',
            expenseId: 'e1'
        }))

        expect(expenses.delete).toHaveBeenCalled()
        expect(expenses.eq).toHaveBeenCalledWith('household_id', 'h1')
        expect(expenses.eq).toHaveBeenCalledWith('id', 'e1')
        expect(revalidatePath).toHaveBeenCalledWith('/household/name/expenses')
    })
})

describe('toggleExpense', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('updates the paid status and revalidates', async () => {
        const expenses = mockQueryBuilder(queryResult(null))
        const supabase = mockSupabaseClient({ from: { expenses: expenses } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await toggleExpense('e1', true, 'name')

        expect(expenses.update).toHaveBeenCalledWith({ is_paid: true })
        expect(expenses.eq).toHaveBeenCalledWith('id', 'e1')
        expect(revalidatePath).toHaveBeenCalledWith('/household/name/expenses')
    })

    it('still revalidates when the update fails', async () => {
        const expenses = mockQueryBuilder(queryResult(null, { message: 'boom' }))
        const supabase = mockSupabaseClient({ from: { expenses: expenses } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)
        vi.spyOn(console, 'error').mockImplementation(() => {})

        await toggleExpense('e1', false, 'name')

        expect(revalidatePath).toHaveBeenCalledWith('/household/name/expenses')
    })
})

describe('rolloverRecurringExpenses', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-08-15T00:00:00.000Z'))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('logs an error and does not update anything when fetching due expenses fails', async () => {
        const expenses = mockQueryBuilder(queryResult(null, { message: 'boom' }))
        const supabase = mockSupabaseClient({ from: { expenses: expenses } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

        await rolloverRecurringExpenses('h1')

        expect(expenses.select).toHaveBeenCalledWith('id, paid_on')
        expect(expenses.eq).toHaveBeenCalledWith('household_id', 'h1')
        expect(expenses.eq).toHaveBeenCalledWith('category', 'recurring')
        expect(expenses.lt).toHaveBeenCalledWith('paid_on', '2026-08-15')
        expect(expenses.update).not.toHaveBeenCalled()
        expect(consoleError).toHaveBeenCalled()
    })

    it('does nothing when there are no due recurring expenses', async () => {
        const expenses = mockQueryBuilder(queryResult([]))
        const supabase = mockSupabaseClient({ from: { expenses: expenses } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await rolloverRecurringExpenses('h1')

        expect(expenses.update).not.toHaveBeenCalled()
    })

    it('rolls a due expense forward to the next month and marks it unpaid', async () => {
        const expenses = mockQueryBuilder(queryResult([{ id: 'e1', paid_on: '2026-07-15' }]))
        const supabase = mockSupabaseClient({ from: { expenses: expenses } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await rolloverRecurringExpenses('h1')

        expect(expenses.update).toHaveBeenCalledWith({ is_paid: false, paid_on: '2026-08-15' })
        expect(expenses.eq).toHaveBeenCalledWith('id', 'e1')
    })

    it('rolls an expense forward past every month it missed until it is no longer overdue', async () => {
        const expenses = mockQueryBuilder(queryResult([{ id: 'e1', paid_on: '2026-05-15' }]))
        const supabase = mockSupabaseClient({ from: { expenses: expenses } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await rolloverRecurringExpenses('h1')

        expect(expenses.update).toHaveBeenCalledWith({ is_paid: false, paid_on: '2026-08-15' })
    })

    it('logs an error but keeps rolling over the remaining expenses when one update fails', async () => {
        let thenCallCount = 0
        const expenses = {
            select: vi.fn(() => expenses),
            eq: vi.fn(() => expenses),
            lt: vi.fn(() => expenses),
            update: vi.fn(() => expenses),
            then: (onFulfilled: (r: unknown) => unknown) => {
                thenCallCount++
                if (thenCallCount === 1) {
                    return Promise.resolve(queryResult([
                        { id: 'e1', paid_on: '2026-07-15' },
                        { id: 'e2', paid_on: '2026-07-15' },
                    ])).then(onFulfilled)
                }
                const result = thenCallCount === 2 ? queryResult(null, { message: 'boom' }) : queryResult(null)
                return Promise.resolve(result).then(onFulfilled)
            },
        }
        const supabase = mockSupabaseClient({ from: { expenses } } as never)
        vi.mocked(createClient).mockResolvedValue(supabase as never)
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

        await rolloverRecurringExpenses('h1')

        expect(expenses.update).toHaveBeenCalledTimes(2)
        expect(expenses.eq).toHaveBeenCalledWith('id', 'e1')
        expect(expenses.eq).toHaveBeenCalledWith('id', 'e2')
        expect(consoleError).toHaveBeenCalledTimes(1)
    })
})
