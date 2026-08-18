import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHousehold, joinHousehold } from './actions'
import { createClient } from '@/lib/supabase/server'
import { mockSupabaseClient, mockQueryBuilder, queryResult, formData } from '@/lib/supabase/testing'

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

describe('createHousehold', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })
    
    it('does nothing when there is no authenticated user', async () => {
        const supabase = mockSupabaseClient({ user: null })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        expect(createHousehold(formData({ name: 'name' })))
            .rejects.toThrow('NEXT_REDIRECT')

        expect(supabase.from).not.toHaveBeenCalled()
    })

    it('creates new household when everything is valid', async () => {
        const supabase = mockSupabaseClient({ user: { id: 'u1' } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(createHousehold(formData({ name: 'name' })))
            .rejects.toThrow('NEXT_REDIRECT')

        expect(supabase.rpc).toHaveBeenCalledWith('create_household_and_join', { household_name: 'name' })
    })
})

describe('joinHousehold', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('does nothing when there is no authenticated user', () => {
        const supabase = mockSupabaseClient({ user: null })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        expect(joinHousehold(formData({ housholdId: 'h1' })))
            .rejects.toThrow('NEXT_REDIRECT')

        expect(supabase.from).not.toHaveBeenCalled()
    })

    it('joins new household on valid id', async () => {
        const profilesToHouseholds = mockQueryBuilder(queryResult(null))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { profiles_to_households: profilesToHouseholds } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(joinHousehold(formData({ householdId: 'h1' })))
            .rejects.toThrow('NEXT_REDIRECT')

        expect(supabase.from).toHaveBeenCalledWith('profiles_to_households')
    })

    it('redirects with an error when no household exists with that id', async () => {
        const rawMessage = 'insert or update on table "profiles_to_households" violates foreign key constraint "profiles_to_households_household_id_fkey"'
        const userMessage = 'No household with that ID exists. Please double-check and try again.'
        const profilesToHouseholds = mockQueryBuilder(queryResult(null, { message: rawMessage, code: '23503' }))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { profiles_to_households: profilesToHouseholds } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        const error: { digest?: string } = await joinHousehold(formData({ householdId: 'nonexistent' })).catch(e => e)

        expect(error.digest).toContain(`/household/setup?error=${encodeURIComponent(userMessage)}`)
    })
})