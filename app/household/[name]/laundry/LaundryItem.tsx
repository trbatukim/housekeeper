'use client'
import { useState, useTransition } from 'react'
import { toggleLaundry } from './actions'

function formatEndsAt(dateString: string) {
    return new Date(dateString).toLocaleString()
}

export default function LaundryItem({
    item,
    householdName,
}: {
    item: { id: string; ends_at: string; status: string }
    householdName: string
}) {
    const [isDone, setIsDone] = useState(item.status === 'done')
    const [, startTransition] = useTransition()

    function handleToggle() {
        const next = !isDone
        setIsDone(next) // updates instantly, before the server responds
        startTransition(() => {
            toggleLaundry(item.id, next, householdName)
        })
    }

    return (
        <>
            <input
                type="checkbox"
                checked={isDone}
                onChange={handleToggle}
                autoComplete="off"
            />
            <span style={{ textDecoration: isDone ? 'line-through' : 'none' }}>
                Ends at {formatEndsAt(item.ends_at)}
            </span>
        </>
    )
}
