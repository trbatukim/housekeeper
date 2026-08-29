'use client'

import { useEffect } from 'react'
import { useHouseholdTheme } from './HouseholdThemeContext'

export default function HouseholdThemeSync({ color }: { color: string }) {
    const { setColor } = useHouseholdTheme()

    useEffect(() => {
        setColor(color)
        document.documentElement.style.setProperty('--app-primary', color)
        return () => {
            setColor(null)
            document.documentElement.style.removeProperty('--app-primary')
        }
    }, [color, setColor])

    return null
}
