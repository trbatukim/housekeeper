import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { addLaundry, deleteLaundry } from './actions'
import { createClient } from '@/lib/supabase/server'
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

describe('addLaundry', () => {
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

        await addLaundry(formData({
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

        await expect(addLaundry(formData({
            householdId: 'h1',
            householdName: 'name',
            hours: '0',
            minutes: '0'
        }))).rejects.toThrow('NEXT_REDIRECT')

        expect(sendNtfyReq).not.toHaveBeenCalled()
        expect(supabase.from).not.toHaveBeenCalled()
    })

    it('adds laundry and schedules a notification when everything is valid', async () => {
        vi.mocked(sendNtfyReq).mockResolvedValue('ntfy1')
        const laundryLoads = mockQueryBuilder(queryResult(null))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { laundry_loads: laundryLoads } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await addLaundry(formData({
            householdId: 'h1',
            householdName: 'name',
            hours: '1',
            minutes: '0'
        }))

        expect(sendNtfyReq).toHaveBeenCalledWith('Laundry done!', '2024-01-01T01:00:00.000Z', 'name', 'h1')
        expect(laundryLoads.insert).toHaveBeenCalledWith({
            household_id: 'h1',
            ends_at: '2024-01-01T01:00:00.000Z',
            status: 'running',
            ntfy_seq_id: 'ntfy1',
        })
        expect(cancelNtfyReq).not.toHaveBeenCalled()
    })

    it('cancels the notification and redirects with an error when the insert fails', async () => {
        vi.mocked(sendNtfyReq).mockResolvedValue('ntfy1')
        const laundryLoads = mockQueryBuilder(queryResult(null, { message: 'boom' }))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { laundry_loads: laundryLoads } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(addLaundry(formData({
            householdId: 'h1',
            householdName: 'name',
            hours: '1',
            minutes: '0'
        }))).rejects.toThrow('NEXT_REDIRECT')

        expect(cancelNtfyReq).toHaveBeenCalledWith('ntfy1', 'h1')
    })

    it('does not attempt to cancel a notification that was never scheduled when the insert fails', async () => {
        vi.mocked(sendNtfyReq).mockResolvedValue(undefined)
        const laundryLoads = mockQueryBuilder(queryResult(null, { message: 'boom' }))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { laundry_loads: laundryLoads } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(addLaundry(formData({
            householdId: 'h1',
            householdName: 'name',
            hours: '1',
            minutes: '0'
        }))).rejects.toThrow('NEXT_REDIRECT')

        expect(cancelNtfyReq).not.toHaveBeenCalled()
    })
})

describe('deleteLaundry', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('does nothing when there is no authenticated user', async () => {
        const supabase = mockSupabaseClient({ user: null })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await deleteLaundry(formData({
            householdId: 'h1',
            householdName: 'name',
            laundryId: 'l1',
            notificationId: 'ntfy1'
        }))

        expect(supabase.from).not.toHaveBeenCalled()
        expect(cancelNtfyReq).not.toHaveBeenCalled()
    })

    it('redirects with an error when the delete fails', async () => {
        const laundryLoads = mockQueryBuilder(queryResult(null, { message: 'boom' }))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { laundry_loads: laundryLoads } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(deleteLaundry(formData({
            householdId: 'h1',
            householdName: 'name',
            laundryId: 'l1',
            notificationId: 'ntfy1'
        }))).rejects.toThrow('NEXT_REDIRECT')

        expect(cancelNtfyReq).not.toHaveBeenCalled()
    })

    it('redirects with an error when the delete is blocked by RLS', async () => {
        const laundryLoads = mockQueryBuilder(queryResult([]))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { laundry_loads: laundryLoads } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(deleteLaundry(formData({
            householdId: 'h1',
            householdName: 'name',
            laundryId: 'l1',
            notificationId: 'ntfy1'
        }))).rejects.toThrow('NEXT_REDIRECT')

        expect(cancelNtfyReq).not.toHaveBeenCalled()
    })

    it('cancels the notification and revalidates on success', async () => {
        const laundryLoads = mockQueryBuilder(queryResult([{ id: 'l1' }]))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { laundry_loads: laundryLoads } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await deleteLaundry(formData({
            householdId: 'h1',
            householdName: 'name',
            laundryId: 'l1',
            notificationId: 'ntfy1'
        }))

        expect(laundryLoads.eq).toHaveBeenCalledWith('household_id', 'h1')
        expect(laundryLoads.eq).toHaveBeenCalledWith('id', 'l1')
        expect(cancelNtfyReq).toHaveBeenCalledWith('ntfy1', 'h1')
    })

    it('does not attempt to cancel a notification when none is associated with the load', async () => {
        const laundryLoads = mockQueryBuilder(queryResult([{ id: 'l1' }]))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { laundry_loads: laundryLoads } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await deleteLaundry(formData({
            householdId: 'h1',
            householdName: 'name',
            laundryId: 'l1'
        }))

        expect(cancelNtfyReq).not.toHaveBeenCalled()
    })
})
