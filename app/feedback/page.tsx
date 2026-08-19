import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { submitFeedback } from './actions'
import styles from './feedback.module.css'
import type { Metadata } from "next";
import Link from 'next/link'

export const metadata: Metadata = {
    title: "Feedback"
}

function refererPath(referer: string | null): string {
    if (!referer) return ''
    try {
        return new URL(referer).pathname
    } catch {
        return ''
    }
}

export default async function FeedbackPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; success?: string }>
}) {
    const { error: errorMessage, success } = await searchParams

    const headersList = await headers()
    const page = refererPath(headersList.get('referer'))

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <div className="container">
            <Link href={page} className="backButton">&larr; Back</Link>
            <h1 className="title">Feedback</h1>
            <div className="contentBox">
                <form action={submitFeedback} className={styles.form}>
                    <input type="hidden" name="pagePath" value={page} />

                    <div className={styles.field}>
                        <label className={styles.label}>Email (optional)</label>
                        <input type="email" name="email" className="input" placeholder="Email" defaultValue={user?.email ?? ''} />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Category</label>
                        <select name="category" className="select">
                            <option value="bug">Bug</option>
                            <option value="idea">Idea</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Message</label>
                        <textarea name="message" required className={`input ${styles.messageInput}`} placeholder="Leave your message here..." />
                    </div>

                    <button className="button">Submit</button>
                </form>
                {errorMessage && <p className="error">{errorMessage}</p>}
                {success && <p>Thanks for the feedback!</p>}
            </div>
        </div>
    )
}
