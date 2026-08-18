'use client'
import { useState, type ChangeEvent } from 'react'
import styles from '@/app/household/[name]/theme.module.css'

function clamp(value: number, max: number) {
    if (Number.isNaN(value)) return 0
    return Math.min(max, Math.max(0, value))
}

export default function EndTimePicker({
    label = 'Ends in',
}: {
    label?: string
}) {
    const [hours, setHours] = useState('')
    const [minutes, setMinutes] = useState('')

    function handleChange(setter: (value: string) => void, max: number) {
        return (e: ChangeEvent<HTMLInputElement>) => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 2)
            setter(digits === '' ? '' : clamp(Number(digits), max).toString())
        }
    }

    function handleBlur(value: string, setter: (value: string) => void) {
        return () => {
            if (value === '') return
            setter(Number(value).toString().padStart(2, '0'))
        }
    }

    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            {label && <span>{label}</span>}
            <input
                type="text"
                inputMode="numeric"
                name="hours"
                value={hours}
                onChange={handleChange(setHours, 99)}
                onBlur={handleBlur(hours, setHours)}
                placeholder="HH"
                aria-label="Hours"
                maxLength={2}
                className={styles.input}
                style={{ width: '2.5em', padding: '8px 3px', textAlign: 'center' }}            />
            <span>:</span>
            <input
                type="text"
                inputMode="numeric"
                name="minutes"
                value={minutes}
                onChange={handleChange(setMinutes, 59)}
                onBlur={handleBlur(minutes, setMinutes)}
                placeholder="MM"
                aria-label="Minutes"
                maxLength={2}
                className={styles.input}
                style={{ width: '2.5em', padding: '8px 3px', textAlign: 'center' }}
            />
        </span>
    )
}
