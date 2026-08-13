'use client'

import { useState, useEffect } from 'react'

export function formatEndsAt(dateString: string) {
    const time = new Date(dateString).toLocaleString().split(' ')[1]
    const [hours, minutes] = time.split(':')
    return `${hours}:${minutes}`
}

export function formatRemaining(ms: number) {
    if (ms <= 0) return 'Done'

    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    const mm = minutes.toString().padStart(2, '0')
    const ss = seconds.toString().padStart(2, '0')

    return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}

export default function Timer({ endsAt }: { endsAt: string }) {
    const target = new Date(endsAt).getTime()
    const [remaining, setRemaining] = useState(() => target - Date.now())

    useEffect(() => {
        const interval = setInterval(() => {
            setRemaining(target - Date.now())
        }, 1000)

        return () => clearInterval(interval)
    }, [target])

    return <span>{formatRemaining(remaining)}</span>
}
