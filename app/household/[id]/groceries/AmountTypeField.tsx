'use client'
import { useState } from 'react'
import styles from '../theme.module.css'
import { CUSTOM_AMOUNT_TYPE } from './constants'
import { NAME_MAX_LENGTH } from '@/lib/textLimits'

export default function AmountTypeField() {
    const [isCustom, setIsCustom] = useState(false)

    return (
        <>
            <select
                name="amountType"
                required
                defaultValue="g"
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
                    className={styles.input}
                />
            )}
        </>
    )
}
