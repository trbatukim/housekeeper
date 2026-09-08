import { describe, it, expect, vi, beforeEach } from 'vitest'
import { startDemo } from './actions'
import { createClient } from '@/lib/supabase/server'
import { mockSupabaseClient, mockQueryBuilder, queryResult } from '@/lib/supabase/testing'

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}))

function mockSeedTables() {
    return {
        grocery_items: mockQueryBuilder(queryResult(null)),
        expenses: mockQueryBuilder(queryResult(null)),
        laundry_loads: mockQueryBuilder(queryResult(null)),
        dishwasher_loads: mockQueryBuilder(queryResult(null)),
    }
}

describe('startDemo', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('signs in anonymously, creates a household, seeds sample data, and redirects there', async () => {
        const from = mockSeedTables()
        const supabase = mockSupabaseClient({ rpcResult: queryResult('h1'), from })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        const error: { digest?: string } = await startDemo().catch(e => e)

        expect(supabase.auth.signInAnonymously).toHaveBeenCalledWith({ options: { data: { name: 'Guest' } } })
        expect(supabase.rpc).toHaveBeenCalledWith('create_household_and_join', { household_name: 'Demo Household' })
        expect(from.grocery_items.insert).toHaveBeenCalled()
        expect(from.expenses.insert).toHaveBeenCalled()
        expect(from.laundry_loads.insert).toHaveBeenCalled()
        expect(from.dishwasher_loads.insert).toHaveBeenCalled()
        expect(error.digest).toContain('/household/h1')
    })

    it('redirects to /welcome with an error when anonymous sign-in fails', async () => {
        const supabase = mockSupabaseClient({ authError: { message: 'nope' } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        const error: { digest?: string } = await startDemo().catch(e => e)

        expect(supabase.rpc).not.toHaveBeenCalled()
        expect(error.digest).toContain('/welcome?error=')
    })

    it('redirects to /welcome with an error when the household cannot be created', async () => {
        const supabase = mockSupabaseClient({ rpcResult: queryResult(null, { message: 'db error' }) })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        const error: { digest?: string } = await startDemo().catch(e => e)

        expect(supabase.from).not.toHaveBeenCalled()
        expect(error.digest).toContain('/welcome?error=')
    })
})
