'use client'
import { useState, type ChangeEvent } from 'react'

function clamp(value: number, max: number) {
    if (Number.isNaN(value)) return 0
    return Math.min(max, Math.max(0, value))
}

export default function EndTimePicker({
    name = 'durationSeconds',
    label = 'Ends in',
}: {
    name?: string
    label?: string
}) {
    const [hours, setHours] = useState('00')
    const [minutes, setMinutes] = useState('00')

    const totalSeconds = Number(hours) * 3600 + Number(minutes) * 60

    function handleChange(setter: (value: string) => void, max: number) {
        return (e: ChangeEvent<HTMLInputElement>) => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 2)
            setter(digits === '' ? '' : clamp(Number(digits), max).toString())
        }
    }

    function handleBlur(value: string, setter: (value: string) => void) {
        return () => setter((value === '' ? 0 : Number(value)).toString().padStart(2, '0'))
    }

    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {label && <span>{label}</span>}
            <input
                type="text"
                inputMode="numeric"
                value={hours}
                onChange={handleChange(setHours, 99)}
                onBlur={handleBlur(hours, setHours)}
                aria-label="Hours"
                maxLength={2}
                style={{ width: '2.5em', textAlign: 'center' }}
            />
            <span>:</span>
            <input
                type="text"
                inputMode="numeric"
                value={minutes}
                onChange={handleChange(setMinutes, 59)}
                onBlur={handleBlur(minutes, setMinutes)}
                aria-label="Minutes"
                maxLength={2}
                style={{ width: '2.5em', textAlign: 'center' }}
            />
            <input type="hidden" name={name} value={totalSeconds} />
        </span>
    )
}
