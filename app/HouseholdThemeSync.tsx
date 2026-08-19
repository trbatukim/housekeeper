'use client'

import { useEffect } from 'react'
import { useHouseholdTheme } from './HouseholdThemeContext'

export default function HouseholdThemeSync({ color }: { color: string }) {
    const { setColor } = useHouseholdTheme()

    useEffect(() => {
        setColor(color)
        return () => setColor(null)
    }, [color, setColor])

    return null
}
