'use client'
import { useRef, useTransition } from 'react'
import { updatePrimaryColor } from './actions'
import styles from './theme.module.css'

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
    const [, startTransition] = useTransition()

    return (
        <form ref={formRef} action={updatePrimaryColor} className={styles.colorPickerForm}>
            <input type="hidden" name="householdId" value={householdId} />
            <input type="hidden" name="householdName" value={householdName} />
            <label className={styles.colorPickerLabel}>
                Theme color
                <input
                    type="color"
                    name="color"
                    defaultValue={color}
                    className={styles.colorInput}
                    onChange={() => startTransition(() => formRef.current?.requestSubmit())}
                />
            </label>
        </form>
    )
}
