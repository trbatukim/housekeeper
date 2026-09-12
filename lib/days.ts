// Values match the meals.day_of_week check constraint in supabase/schema.sql.
export const DAYS_OF_WEEK = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
] as const

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number]

export const isDayOfWeek = (value: string | null): value is DayOfWeek =>
    (DAYS_OF_WEEK as readonly (string | null)[]).includes(value)

export const dayLabel = (day: DayOfWeek) => day.charAt(0).toUpperCase() + day.slice(1)
