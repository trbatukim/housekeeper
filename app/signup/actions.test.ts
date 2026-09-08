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

    await expect(signup(formData({ name: 'name', email: 'a@b.com', password: 'secret' })))
      .rejects.toThrow('REDIRECT:/signup?message=Check%20your%20email%20to%20confirm%20your%20account.')

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'secret',
      options: { data: { name: 'name' } }
    })
  })

  it('redirects back to /signup with the error message on failure', async () => {
    const supabase = mockSupabaseClient({ authError: { message: 'Email already registered' } })
    vi.mocked(createClient).mockResolvedValue(supabase as never)

    await expect(signup(formData({ name: 'name', email: 'a@b.com', password: 'secret' })))
      .rejects.toThrow('REDIRECT:/signup?error=Email%20already%20registered')
  })

  it('upgrades an anonymous demo user in place instead of signing up a new one', async () => {
    const supabase = mockSupabaseClient({ user: { id: 'u1', is_anonymous: true }, authError: null })
    vi.mocked(createClient).mockResolvedValue(supabase as never)

    await expect(signup(formData({ name: 'name', email: 'a@b.com', password: 'secret' })))
      .rejects.toThrow('REDIRECT:/signup?message=Check%20your%20email%20to%20confirm%20your%20account.')

    expect(supabase.auth.updateUser).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'secret',
      data: { name: 'name' },
    })
    expect(supabase.auth.signUp).not.toHaveBeenCalled()
  })
})
