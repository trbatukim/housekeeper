import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signup } from './actions'
import { createClient } from '@/lib/supabase/server'
import { mockSupabaseClient, formData } from '@/lib/supabase/testing'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`) }),
}))

describe('signup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects back to /signup with a confirmation message on success', async () => {
    const supabase = mockSupabaseClient({ authError: null })
    vi.mocked(createClient).mockResolvedValue(supabase as never)

    await expect(signup(formData({ email: 'a@b.com', password: 'secret' })))
      .rejects.toThrow('REDIRECT:/signup?message=Check%20your%20email%20to%20confirm%20your%20account.')

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'secret',
    })
  })

  it('redirects back to /signup with the error message on failure', async () => {
    const supabase = mockSupabaseClient({ authError: { message: 'Email already registered' } })
    vi.mocked(createClient).mockResolvedValue(supabase as never)

    await expect(signup(formData({ email: 'a@b.com', password: 'secret' })))
      .rejects.toThrow('REDIRECT:/signup?error=Email%20already%20registered')
  })
})
