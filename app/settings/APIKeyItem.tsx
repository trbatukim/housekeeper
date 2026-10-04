'use client'

import { useActionState } from "react"
import { createAPIKey, type APIKeyState } from "./actions"
import CopyButton from "@/app/household/[id]/CopyButton"
import styles from "./settings.module.css"

const initialState: APIKeyState = {}

export default function APIKeyItem({
    household,
}: {
    household: { id: string; name: string }
}) {
    const [state, formAction, pending] = useActionState(createAPIKey, initialState)

    return (
        <>
            <label className={styles.label} htmlFor={`key-${household.id}`}>
                {household.name}
            </label>

            <form className={styles.keyForm} action={formAction}>
                <input type="hidden" name="householdId" value={household.id} />

                <span className={styles.inputWrap}>
                    <input
                        id={`key-${household.id}`}
                        className={`input ${styles.keyInput}`}
                        type="text"
                        value={state.key ?? ""}
                        placeholder="No key generated yet"
                        readOnly
                        autoComplete="off"
                        onFocus={(e) => e.currentTarget.select()}
                    />
                    {state.key && (
                        <span className={styles.copySlot}>
                            <CopyButton text={state.key} />
                        </span>
                    )}
                </span>

                <button className={`button ${styles.generateButton}`} disabled={pending}>
                    {pending ? "Generating…" : "Get/Reset API Key"}
                </button>
            </form>

            {state.error && <p className="error">{state.error}</p>}
            {state.key && (
                <p className={styles.hint}>
                    Copy this now it isn&apos;t shown again. Generating a new key replaces this one.
                </p>
            )}
        </>
    )
}
