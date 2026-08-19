'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

type HouseholdThemeContextValue = {
    color: string | null
    setColor: (color: string | null) => void
}

const HouseholdThemeContext = createContext<HouseholdThemeContextValue>({
    color: null,
    setColor: () => {},
})

export function HouseholdThemeProvider({ children }: { children: ReactNode }) {
    const [color, setColor] = useState<string | null>(null)
    return (
        <HouseholdThemeContext.Provider value={{ color, setColor }}>
            {children}
        </HouseholdThemeContext.Provider>
    )
}

export function useHouseholdTheme() {
    return useContext(HouseholdThemeContext)
}
