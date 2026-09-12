'use client'
import { useState } from 'react'
import styles from '../theme.module.css'
import { AMOUNT_TYPES, CUSTOM_AMOUNT_TYPE } from '@/lib/amountTypes'
import { NAME_MAX_LENGTH } from '@/lib/textLimits'

export default function AmountTypeField({
    defaultAmountType = 'g',
}: {
    defaultAmountType?: string
}) {
    const isKnown = AMOUNT_TYPES.includes(defaultAmountType)
    const [isCustom, setIsCustom] = useState(!isKnown)

    return (
        <>
            <select
                name="amountType"
                required
                defaultValue={isKnown ? defaultAmountType : CUSTOM_AMOUNT_TYPE}
                className={styles.select}
                onChange={(e) => setIsCustom(e.target.value === CUSTOM_AMOUNT_TYPE)}
            >
                {AMOUNT_TYPES.map((amountType) => (
                    <option key={amountType} value={amountType}>{amountType}</option>
                ))}
                <option value={CUSTOM_AMOUNT_TYPE}>Other...</option>
            </select>
            {isCustom && (
                <input
                    type="text"
                    name="customAmountType"
                    placeholder="Custom unit"
                    required
                    maxLength={NAME_MAX_LENGTH}
                    defaultValue={isKnown ? '' : defaultAmountType}
                    className={styles.input}
                />
            )}
        </>
    )
}
