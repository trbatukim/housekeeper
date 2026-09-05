'use client'

import { useState } from 'react'
import styles from './theme.module.css'

function copyText(text: string) {
    navigator.clipboard.writeText(text)
}

export default function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)

    function handleClick() {
        copyText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

    return (
        <span className={styles.copyButtonWrapper}>
            <button type="button" className={styles.copyButton} aria-label="Copy" onClick={handleClick}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
            </button>
            {copied && <span className={styles.copiedTooltip}>Copied!</span>}
        </span>
    )
}
