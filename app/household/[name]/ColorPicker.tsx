'use client'
import { useRef, useTransition } from 'react'
import { updatePrimaryColor } from './actions'
import styles from './theme.module.css'

const DEFAULT_COLOR = '#a98bff'

const PRESET_COLORS = [
    DEFAULT_COLOR, // violet
    '#ff8a80', // red
    '#ffb74d', // orange
    '#ffe082', // yellow
    '#81c995', // green
    '#4dd0e1', // teal
    '#64b5f6', // blue
    '#f48fb1', // pink
    '#8d6e63', // brown
    '#ffffff', // white
]

export default function ColorPicker({
    householdId,
    householdName,
    color,
}: {
    householdId: string
    householdName: string
    color: string
}) {
    const formRef = useRef<HTMLFormElement>(null)
    const detailsRef = useRef<HTMLDetailsElement>(null)
    const [, startTransition] = useTransition()

    const selectColor = (preset: string) => {
        const input = formRef.current?.elements.namedItem('color') as HTMLInputElement | null
        if (input) {
            input.value = preset
        }
        startTransition(() => formRef.current?.requestSubmit())
        if (detailsRef.current) {
            detailsRef.current.open = false
        }
    }

    return (
        <form ref={formRef} action={updatePrimaryColor} className={styles.colorPickerForm}>
            <input type="hidden" name="householdId" value={householdId} />
            <input type="hidden" name="householdName" value={householdName} />
            <input type="hidden" name="color" value={color} />
            <div className={styles.colorPickerRow}>
                <span className={styles.colorPickerLabelText}>Theme color</span>
                <details ref={detailsRef} className={styles.colorPickerDetails}>
                    <summary
                        className={styles.colorPickerSwatchButton}
                        style={{ backgroundColor: color }}
                        aria-label="Choose theme color"
                    />
                    <div className={styles.colorPickerPanel}>
                        <div className={styles.swatchRow}>
                            {PRESET_COLORS.map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    aria-label={preset}
                                    aria-pressed={preset.toLowerCase() === color.toLowerCase()}
                                    className={styles.swatch}
                                    style={{ backgroundColor: preset }}
                                    onClick={() => selectColor(preset)}
                                />
                            ))}
                        </div>
                    </div>
                </details>
            </div>
            <button type="button" className={styles.resetLink} onClick={() => selectColor(DEFAULT_COLOR)}>
                Reset to default
            </button>
        </form>
    )
}
