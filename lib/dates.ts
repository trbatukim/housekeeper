export function formatDate(dateString: string) {
    const [year, month, day] = dateString.split('-')
    return `${day}/${month}/${year}`
}

const DUE_DATE_PATTERN = /^(\d{2})\.(\d{2})\.(\d{4})$/

/**
 * Converts a `dd.mm.yyyy` due date into the `yyyy-mm-dd` form the `date`
 * columns expect, or null when it isn't a real calendar date. The round-trip
 * check rejects 31.02.2026 instead of letting it roll over into March.
 */
export function parseDueDate(value: string): string | null {
    const match = DUE_DATE_PATTERN.exec(value)

    if (!match) {
        return null
    }

    const [, day, month, year] = match
    const isoDate = `${year}-${month}-${day}`
    const parsed = new Date(`${isoDate}T00:00:00Z`)

    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().split('T')[0] !== isoDate) {
        return null
    }

    return isoDate
}
