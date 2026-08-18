'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function FeedbackButton() {
    const pathname = usePathname()

    if (pathname === '/feedback') return null

    return (
        <Link href="/feedback" className="feedbackButton">Feedback</Link>
    )
}
