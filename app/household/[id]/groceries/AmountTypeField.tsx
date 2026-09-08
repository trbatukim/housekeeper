'use client'
import { useState } from 'react'
import styles from '../theme.module.css'
import { CUSTOM_AMOUNT_TYPE } from './constants'
import { NAME_MAX_LENGTH } from '@/lib/textLimits'

const KNOWN_AMOUNT_TYPES = [
    'g', 'kg', 'mL', 'L', 'pcs', 'dozen',
    'packet(s)', 'bottle(s)', 'can(s)', 'bag(s)', 'jar(s)', 'loaf/loaves',
]

export default function AmountTypeField({
    defaultAmountType = 'g',
}: {
    defaultAmountType?: string
}) {
    const isKnown = KNOWN_AMOUNT_TYPES.includes(defaultAmountType)
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
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="mL">mL</option>
                <option value="L">L</option>
                <option value="pcs">pcs</option>
                <option value="dozen">dozen</option>
                <option value="packet(s)">packet(s)</option>
                <option value="bottle(s)">bottle(s)</option>
                <option value="can(s)">can(s)</option>
                <option value="bag(s)">bag(s)</option>
                <option value="jar(s)">jar(s)</option>
                <option value="loaf/loaves">loaf/loaves</option>
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
