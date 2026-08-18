'use client'
import { useEffect, useRef, useState } from 'react'
import styles from '../theme.module.css'

const OPTIONS = [
    { value: 'one-time', label: 'One-time' },
    { value: 'recurring', label: 'Recurring' },
]

export default function CategorySelect() {
    const [value, setValue] = useState(OPTIONS[0].value)
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const selected = OPTIONS.find((option) => option.value === value) ?? OPTIONS[0]

    return (
        <div className={styles.categoryField} ref={containerRef}>
            <input type="hidden" name="category" value={value} />
            <button
                type="button"
                className={styles.categoryButton}
                onClick={() => setOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                {selected.label}
                <span className={styles.categoryArrow} aria-hidden="true" data-open={open}>▾</span>
            </button>
            {open && (
                <ul className={styles.categoryPopup} role="listbox">
                    {OPTIONS.map((option) => (
                        <li
                            key={option.value}
                            role="option"
                            aria-selected={option.value === value}
                            className={styles.categoryOption}
                            data-selected={option.value === value}
                            onClick={() => {
                                setValue(option.value)
                                setOpen(false)
                            }}
                        >
                            {option.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
