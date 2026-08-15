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