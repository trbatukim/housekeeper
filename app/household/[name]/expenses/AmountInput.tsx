'use client'
import { useRef } from 'react'
import styles from '../theme.module.css'

const STEP = 0.01
const MIN = 0.01

export default function AmountInput() {
    const inputRef = useRef<HTMLInputElement>(null)

    function step(direction: 1 | -1) {
        const input = inputRef.current
        if (!input) return
        const current = parseFloat(input.value) || 0
        const next = Math.max(MIN, Math.round((current + direction * STEP) * 100) / 100)
        input.value = next.toFixed(2)
    }

    return (
        <div className={styles.amountField}>
            <input
                ref={inputRef}
                type="number"
                name="amount"
                placeholder="Price"
                step={STEP}
                min={MIN}
                required
                className={styles.amountInput}
            />
            <div className={styles.stepButtons}>
                <button type="button" className={styles.stepButton} onClick={() => step(1)} aria-label="Increase amount">▲</button>
                <button type="button" className={styles.stepButton} onClick={() => step(-1)} aria-label="Decrease amount">▼</button>
            </div>
        </div>
    )
}
