import { describe, it, expect } from 'vitest'
import { computeDurationSeconds, isValidDuration } from './duration'

describe('computeDurationSeconds', () => {
    it('converts hours and minutes to seconds', () => {
        expect(computeDurationSeconds(1, 30)).toBe(5400)
    })

    it('handles zero duration', () => {
        expect(computeDurationSeconds(0, 0)).toBe(0)
    })

    it('handles minutes-only duration', () => {
        expect(computeDurationSeconds(0, 45)).toBe(2700)
    })

    it('handles hours-only duration', () => {
        expect(computeDurationSeconds(2, 0)).toBe(7200)
    })
})

describe('isValidDuration', () => {
    it('handles NaN', () => {
        expect(isValidDuration(NaN)).toBe(false)
    })

    it('handles seconds being negative', () => {
        expect(isValidDuration(-1)).toBe(false)
    })

    it('handles zero', () => {
        expect(isValidDuration(0)).toBe(false)
    })

    it('works as expected', () => {
        expect(isValidDuration(1)).toBe(true)
    })
})
