import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updatePrimaryColor } from './actions'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { mockSupabaseClient, mockQueryBuilder, queryResult, formData } from '@/lib/supabase/testing'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('updatePrimaryColor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing when there is no authenticated user', async () => {
    const supabase = mockSupabaseClient({ user: null })
    vi.mocked(createClient).mockResolvedValue(supabase as never)

    await updatePrimaryColor(formData({ householdId: '1', householdName: 'name', color: '#abcdef' }))

    expect(supabase.from).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('does nothing when the color is not a valid hex color', async () => {
    const supabase = mockSupabaseClient({ user: { id: 'u1' } })
    vi.mocked(createClient).mockResolvedValue(supabase as never)

    await updatePrimaryColor(formData({ householdId: '1', householdName: 'name', color: 'not a color' }))

    expect(supabase.from).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('does nothing when the update fails', async () => {
    const households = mockQueryBuilder(queryResult(null, { message: 'boom' }))
    const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { households } })
    vi.mocked(createClient).mockResolvedValue(supabase as never)
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await updatePrimaryColor(formData({ householdId: '1', householdName: 'name', color: '#abcdef' }))

    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('revalidates the household paths on success', async () => {
    const households = mockQueryBuilder(queryResult(null))
    const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { households } })
    vi.mocked(createClient).mockResolvedValue(supabase as never)

    await updatePrimaryColor(formData({ householdId: '1', householdName: 'name', color: '#abcdef' }))

    expect(households.update).toHaveBeenCalledWith({ primary_color: '#abcdef' })
    expect(households.eq).toHaveBeenCalledWith('id', '1')
    expect(revalidatePath).toHaveBeenCalledWith('/household/name')
    expect(revalidatePath).toHaveBeenCalledWith('/household/name/groceries')
    expect(revalidatePath).toHaveBeenCalledWith('/household/name/expenses')
    expect(revalidatePath).toHaveBeenCalledWith('/household/name/laundry')
  })
})
