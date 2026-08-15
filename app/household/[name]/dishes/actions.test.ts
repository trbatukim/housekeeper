import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { addDishwasher, deleteDishwasher, toggleDishesStatus } from './actions'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendNtfyReq, cancelNtfyReq } from '@/lib/ntfy'
import { mockSupabaseClient, mockQueryBuilder, queryResult, formData } from '@/lib/supabase/testing'

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

vi.mock('@/lib/ntfy', () => ({
    sendNtfyReq: vi.fn(),
    cancelNtfyReq: vi.fn(),
}))

describe('addDishwasher', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('does nothing when there is no authenticated user', async () => {
        const supabase = mockSupabaseClient({ user: null })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await addDishwasher(formData({
            householdId: 'h1',
            householdName: 'name',
            hours: '1',
            minutes: '0'
        }))

        expect(supabase.from).not.toHaveBeenCalled()
        expect(sendNtfyReq).not.toHaveBeenCalled()
    })

    it('redirects with an error when no duration is set', async () => {
        const supabase = mockSupabaseClient({ user: { id: 'u1' } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(addDishwasher(formData({
            householdId: 'h1',
            householdName: 'name',
            hours: '0',
            minutes: '0'
        }))).rejects.toThrow('NEXT_REDIRECT')

        expect(sendNtfyReq).not.toHaveBeenCalled()
        expect(supabase.from).not.toHaveBeenCalled()
    })

    it('adds a dishwasher load, schedules a notification, and marks dishes as cleaning', async () => {
        vi.mocked(sendNtfyReq).mockResolvedValue('ntfy1')
        const dishwasherLoads = mockQueryBuilder(queryResult(null))
        const dishesStatus = mockQueryBuilder(queryResult(null))
        const supabase = mockSupabaseClient({
            user: { id: 'u1' },
            from: { dishwasher_loads: dishwasherLoads, dishes_status: dishesStatus }
        })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await addDishwasher(formData({
            householdId: 'h1',
            householdName: 'name',
            hours: '1',
            minutes: '0'
        }))

        expect(sendNtfyReq).toHaveBeenCalledWith('Dishwasher done!', '2024-01-01T01:00:00.000Z', 'name', 'h1')
        expect(dishwasherLoads.insert).toHaveBeenCalledWith({
            household_id: 'h1',
            ends_at: '2024-01-01T01:00:00.000Z',
            status: 'running',
            ntfy_seq_id: 'ntfy1',
        })
        expect(dishesStatus.update).toHaveBeenCalledWith({ status: 'cleaning' })
        expect(dishesStatus.eq).toHaveBeenCalledWith('household_id', 'h1')
        expect(cancelNtfyReq).not.toHaveBeenCalled()
        expect(revalidatePath).toHaveBeenCalledWith('/household/name/dishes')
    })

    it('cancels the notification and redirects with an error when the insert fails', async () => {
        vi.mocked(sendNtfyReq).mockResolvedValue('ntfy1')
        const dishwasherLoads = mockQueryBuilder(queryResult(null, { message: 'boom' }))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { dishwasher_loads: dishwasherLoads } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(addDishwasher(formData({
            householdId: 'h1',
            householdName: 'name',
            hours: '1',
            minutes: '0'
        }))).rejects.toThrow('NEXT_REDIRECT')

        expect(cancelNtfyReq).toHaveBeenCalledWith('ntfy1', 'h1')
    })

    it('does not attempt to cancel a notification that was never scheduled when the insert fails', async () => {
        vi.mocked(sendNtfyReq).mockResolvedValue(undefined)
        const dishwasherLoads = mockQueryBuilder(queryResult(null, { message: 'boom' }))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { dishwasher_loads: dishwasherLoads } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(addDishwasher(formData({
            householdId: 'h1',
            householdName: 'name',
            hours: '1',
            minutes: '0'
        }))).rejects.toThrow('NEXT_REDIRECT')

        expect(cancelNtfyReq).not.toHaveBeenCalled()
    })
})

describe('deleteDishwasher', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('does nothing when there is no authenticated user', async () => {
        const supabase = mockSupabaseClient({ user: null })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await deleteDishwasher(formData({
            householdId: 'h1',
            householdName: 'name',
            dishwasherId: 'd1',
            notificationId: 'ntfy1'
        }))

        expect(supabase.from).not.toHaveBeenCalled()
        expect(cancelNtfyReq).not.toHaveBeenCalled()
    })

    it('redirects with an error when the delete fails', async () => {
        const dishwasherLoads = mockQueryBuilder(queryResult(null, { message: 'boom' }))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { dishwasher_loads: dishwasherLoads } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(deleteDishwasher(formData({
            householdId: 'h1',
            householdName: 'name',
            dishwasherId: 'd1',
            notificationId: 'ntfy1'
        }))).rejects.toThrow('NEXT_REDIRECT')

        expect(cancelNtfyReq).not.toHaveBeenCalled()
    })

    it('redirects with an error when the delete is blocked by RLS', async () => {
        const dishwasherLoads = mockQueryBuilder(queryResult([]))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { dishwasher_loads: dishwasherLoads } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(deleteDishwasher(formData({
            householdId: 'h1',
            householdName: 'name',
            dishwasherId: 'd1',
            notificationId: 'ntfy1'
        }))).rejects.toThrow('NEXT_REDIRECT')

        expect(cancelNtfyReq).not.toHaveBeenCalled()
    })

    it('cancels the notification and revalidates on success', async () => {
        const dishwasherLoads = mockQueryBuilder(queryResult([{ id: 'd1' }]))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { dishwasher_loads: dishwasherLoads } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await deleteDishwasher(formData({
            householdId: 'h1',
            householdName: 'name',
            dishwasherId: 'd1',
            notificationId: 'ntfy1'
        }))

        expect(dishwasherLoads.eq).toHaveBeenCalledWith('household_id', 'h1')
        expect(dishwasherLoads.eq).toHaveBeenCalledWith('id', 'd1')
        expect(cancelNtfyReq).toHaveBeenCalledWith('ntfy1', 'h1')
        expect(revalidatePath).toHaveBeenCalledWith('/household/name/dishes')
    })

    it('does not attempt to cancel a notification when none is associated with the load', async () => {
        const dishwasherLoads = mockQueryBuilder(queryResult([{ id: 'd1' }]))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { dishwasher_loads: dishwasherLoads } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await deleteDishwasher(formData({
            householdId: 'h1',
            householdName: 'name',
            dishwasherId: 'd1'
        }))

        expect(cancelNtfyReq).not.toHaveBeenCalled()
    })

    it('marks dishes as clean when no other loads are still running', async () => {
        const deleteResult = mockQueryBuilder(queryResult([{ id: 'd1' }]))
        const remainingLoads = mockQueryBuilder(queryResult([]))
        const dishesStatus = mockQueryBuilder(queryResult(null))
        const supabase = mockSupabaseClient({
            user: { id: 'u1' },
            from: { dishwasher_loads: deleteResult, dishes_status: dishesStatus }
        })
        let dishwasherLoadCalls = 0
        vi.mocked(supabase.from).mockImplementation((table: string) => {
            if (table === 'dishwasher_loads') {
                dishwasherLoadCalls += 1
                return (dishwasherLoadCalls === 1 ? deleteResult : remainingLoads) as never
            }
            if (table === 'dishes_status') return dishesStatus as never
            throw new Error(`no mock configured for table "${table}"`)
        })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await deleteDishwasher(formData({
            householdId: 'h1',
            householdName: 'name',
            dishwasherId: 'd1',
            notificationId: 'ntfy1'
        }))

        expect(dishesStatus.update).toHaveBeenCalledWith({ status: 'clean' })
        expect(dishesStatus.eq).toHaveBeenCalledWith('household_id', 'h1')
    })

    it('does not mark dishes as clean while another load is still running', async () => {
        const deleteResult = mockQueryBuilder(queryResult([{ id: 'd1' }]))
        const remainingLoads = mockQueryBuilder(queryResult([{ id: 'd2' }]))
        const dishesStatus = mockQueryBuilder(queryResult(null))
        const supabase = mockSupabaseClient({
            user: { id: 'u1' },
            from: { dishwasher_loads: deleteResult, dishes_status: dishesStatus }
        })
        let dishwasherLoadCalls = 0
        vi.mocked(supabase.from).mockImplementation((table: string) => {
            if (table === 'dishwasher_loads') {
                dishwasherLoadCalls += 1
                return (dishwasherLoadCalls === 1 ? deleteResult : remainingLoads) as never
            }
            if (table === 'dishes_status') return dishesStatus as never
            throw new Error(`no mock configured for table "${table}"`)
        })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await deleteDishwasher(formData({
            householdId: 'h1',
            householdName: 'name',
            dishwasherId: 'd1',
            notificationId: 'ntfy1'
        }))

        expect(dishesStatus.update).not.toHaveBeenCalled()
    })
})

describe('toggleDishesStatus', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('updates the status and revalidates', async () => {
        const dishesStatus = mockQueryBuilder(queryResult(null))
        const supabase = mockSupabaseClient({ from: { dishes_status: dishesStatus } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await toggleDishesStatus('h1', 'clean', 'name')

        expect(dishesStatus.update).toHaveBeenCalledWith({ status: 'clean' })
        expect(dishesStatus.eq).toHaveBeenCalledWith('household_id', 'h1')
        expect(revalidatePath).toHaveBeenCalledWith('/household/name/dishes')
    })

    it('still revalidates when the update fails', async () => {
        const dishesStatus = mockQueryBuilder(queryResult(null, { message: 'boom' }))
        const supabase = mockSupabaseClient({ from: { dishes_status: dishesStatus } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)
        vi.spyOn(console, 'error').mockImplementation(() => {})

        await toggleDishesStatus('h1', 'dirty', 'name')

        expect(revalidatePath).toHaveBeenCalledWith('/household/name/dishes')
    })
})
