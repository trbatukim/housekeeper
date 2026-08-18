import { describe, it, expect, vi, beforeEach } from 'vitest'
import { submitFeedback } from './actions'
import { createClient } from '@/lib/supabase/server'
import { mockSupabaseClient, mockQueryBuilder, queryResult, formData } from '@/lib/supabase/testing'

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}))

vi.mock('next/navigation', () => ({
    redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`) }),
}))

describe('submitFeedback', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('redirects with an error when the message is empty', async () => {
        const supabase = mockSupabaseClient({ user: null })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(submitFeedback(formData({
            message: '   ',
            category: 'bug',
            pagePath: '/',
        }))).rejects.toThrow('REDIRECT:/feedback?error=Please%20enter%20a%20message.')

        expect(supabase.from).not.toHaveBeenCalled()
    })

    it('redirects with an error when the category is invalid', async () => {
        const supabase = mockSupabaseClient({ user: null })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(submitFeedback(formData({
            message: 'hello',
            category: 'nonsense',
            pagePath: '/',
        }))).rejects.toThrow('REDIRECT:/feedback?error=Invalid%20category.')

        expect(supabase.from).not.toHaveBeenCalled()
    })

    it('inserts feedback with no profile or household when there is no authenticated user', async () => {
        const feedback = mockQueryBuilder(queryResult(null))
        const supabase = mockSupabaseClient({ user: null, from: { feedback } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(submitFeedback(formData({
            message: 'it broke',
            category: 'bug',
            pagePath: '/household/kitchen',
        }))).rejects.toThrow('REDIRECT:/feedback?success=1')

        expect(feedback.insert).toHaveBeenCalledWith({
            profile_id: null,
            household_id: null,
            category: 'bug',
            message: 'it broke',
            page_path: '/household/kitchen',
        })
    })

    it('does not look up a household when the page is not a household page', async () => {
        const feedback = mockQueryBuilder(queryResult(null))
        const supabase = mockSupabaseClient({ user: { id: 'u1' }, from: { feedback } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(submitFeedback(formData({
            message: 'nice app',
            category: 'idea',
            pagePath: '/dashboard',
        }))).rejects.toThrow('REDIRECT:/feedback?success=1')

        expect(feedback.insert).toHaveBeenCalledWith({
            profile_id: 'u1',
            household_id: null,
            category: 'idea',
            message: 'nice app',
            page_path: '/dashboard',
        })
    })

    it('looks up the household and attaches its id when the user belongs to it', async () => {
        const membership = mockQueryBuilder(queryResult({ households: { id: 'h1', name: 'Kitchen' } }))
        const feedback = mockQueryBuilder(queryResult(null))
        const supabase = mockSupabaseClient({
            user: { id: 'u1' },
            from: { profiles_to_households: membership, feedback },
        })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(submitFeedback(formData({
            message: 'nice app',
            category: 'idea',
            pagePath: '/household/Kitchen',
        }))).rejects.toThrow('REDIRECT:/feedback?success=1')

        expect(membership.eq).toHaveBeenCalledWith('profile_id', 'u1')
        expect(membership.eq).toHaveBeenCalledWith('households.name', 'Kitchen')
        expect(feedback.insert).toHaveBeenCalledWith(expect.objectContaining({ household_id: 'h1' }))
    })

    it('decodes URI-encoded household names before looking up the household', async () => {
        const membership = mockQueryBuilder(queryResult({ households: { id: 'h1', name: 'My Kitchen' } }))
        const feedback = mockQueryBuilder(queryResult(null))
        const supabase = mockSupabaseClient({
            user: { id: 'u1' },
            from: { profiles_to_households: membership, feedback },
        })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(submitFeedback(formData({
            message: 'nice app',
            category: 'idea',
            pagePath: '/household/My%20Kitchen',
        }))).rejects.toThrow('REDIRECT:/feedback?success=1')

        expect(membership.eq).toHaveBeenCalledWith('households.name', 'My Kitchen')
    })

    it('handles households returned as an array', async () => {
        const membership = mockQueryBuilder(queryResult({ households: [{ id: 'h1', name: 'Kitchen' }] }))
        const feedback = mockQueryBuilder(queryResult(null))
        const supabase = mockSupabaseClient({
            user: { id: 'u1' },
            from: { profiles_to_households: membership, feedback },
        })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(submitFeedback(formData({
            message: 'nice app',
            category: 'idea',
            pagePath: '/household/Kitchen',
        }))).rejects.toThrow('REDIRECT:/feedback?success=1')

        expect(feedback.insert).toHaveBeenCalledWith(expect.objectContaining({ household_id: 'h1' }))
    })

    it('inserts a null household id when the user has no membership', async () => {
        const membership = mockQueryBuilder(queryResult(null))
        const feedback = mockQueryBuilder(queryResult(null))
        const supabase = mockSupabaseClient({
            user: { id: 'u1' },
            from: { profiles_to_households: membership, feedback },
        })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(submitFeedback(formData({
            message: 'nice app',
            category: 'idea',
            pagePath: '/household/Kitchen',
        }))).rejects.toThrow('REDIRECT:/feedback?success=1')

        expect(feedback.insert).toHaveBeenCalledWith(expect.objectContaining({ household_id: null }))
    })

    it('trims and includes the email when provided', async () => {
        const feedback = mockQueryBuilder(queryResult(null))
        const supabase = mockSupabaseClient({ user: null, from: { feedback } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(submitFeedback(formData({
            message: 'hello',
            category: 'other',
            pagePath: '/',
            email: '  a@b.com  ',
        }))).rejects.toThrow('REDIRECT:/feedback?success=1')

        expect(feedback.insert).toHaveBeenCalledWith(expect.objectContaining({ email: 'a@b.com' }))
    })

    it('omits the email field when not provided', async () => {
        const feedback = mockQueryBuilder(queryResult(null))
        const supabase = mockSupabaseClient({ user: null, from: { feedback } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(submitFeedback(formData({
            message: 'hello',
            category: 'other',
            pagePath: '/',
        }))).rejects.toThrow('REDIRECT:/feedback?success=1')

        expect(feedback.insert).toHaveBeenCalledWith(
            expect.not.objectContaining({ email: expect.anything() })
        )
    })

    it('omits the page_path field when pagePath is empty', async () => {
        const feedback = mockQueryBuilder(queryResult(null))
        const supabase = mockSupabaseClient({ user: null, from: { feedback } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(submitFeedback(formData({
            message: 'hello',
            category: 'other',
            pagePath: '',
        }))).rejects.toThrow('REDIRECT:/feedback?success=1')

        expect(feedback.insert).toHaveBeenCalledWith(
            expect.not.objectContaining({ page_path: expect.anything() })
        )
    })

    it('redirects with the error message when the insert fails', async () => {
        const feedback = mockQueryBuilder(queryResult(null, { message: 'insert failed' }))
        const supabase = mockSupabaseClient({ user: null, from: { feedback } })
        vi.mocked(createClient).mockResolvedValue(supabase as never)

        await expect(submitFeedback(formData({
            message: 'hello',
            category: 'other',
            pagePath: '/',
        }))).rejects.toThrow('REDIRECT:/feedback?error=insert%20failed')
    })
})
