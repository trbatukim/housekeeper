'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { CSSProperties } from 'react'
import { useHouseholdTheme } from './HouseholdThemeContext'

export default function FeedbackButton() {
    const pathname = usePathname()
    const { color } = useHouseholdTheme()

    if (pathname === '/feedback') return null

    return (
        <Link
            href="/feedback"
            className="feedbackButton"
            style={color ? ({ '--primary': color } as CSSProperties) : undefined}
        >
            Feedback
        </Link>
    )
}
