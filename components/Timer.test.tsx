import { describe, it, expect } from 'vitest'
import { formatRemaining, formatEndsAt } from './Timer'

describe('formatRemaining', () => {
    it('returns "Done" when time has passed', () => {
        expect(formatRemaining(0)).toBe('Done')
        expect(formatRemaining(-1000)).toBe('Done')
    })

    it('formats seconds and minutes without an hours segment', () => {
        expect(formatRemaining(5000)).toBe('00:05')
        expect(formatRemaining(65000)).toBe('01:05')
    })

    it('formats hours when duration exceeds an hour', () => {
        expect(formatRemaining(3661000)).toBe('1:01:01')
    })

    it('pads minutes and seconds to two digits', () => {
        expect(formatRemaining(3600000 + 5000)).toBe('1:00:05')
    })
})

describe('formatEndsAt', () => {
    it('returns a HH:MM shaped string in local time', () => {
        const date = new Date('2026-08-14T15:45:00Z')
        const expected = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
        const result = formatEndsAt(date.toISOString())
        expect(result).toBe(expected)
    })
})
