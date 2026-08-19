import { headers } from 'next/headers'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { Metadata } from "next";
import styles from './ntfy-info.module.css'

export const metadata: Metadata = {
    title: "ntfy Info"
}

function refererPath(referer: string | null): string {
    if (!referer) return '/household'
    try {
        return new URL(referer).pathname
    } catch {
        return '/household'
    }
}

export default async function NtfyInfoPage() {
    const headersList = await headers()
    const page = refererPath(headersList.get('referer'))

    return (
        <div className="container">
            <Link href={page} className="backButton">&larr; Back</Link>
            <h1 className="title" style={{ marginTop: 20 }}>ntfy Info</h1>
            <div className="contentBox" style={{ marginBottom: 60 }}>
                <p>
                    Housekeeper sends laundry and dishwasher notifications through{' '}
                    <Link className='linkText' href="https://ntfy.sh" target="_blank" rel="noopener noreferrer">ntfy.sh</Link>,
                    a free push notification service. To get notified when a load finishes, subscribe
                    to your household&apos;s topic.
                </p>

                <ol className={styles.steps}>
                    <li>
                        1. Install the ntfy app: {' '}
                        <Link className='linkText' href="https://apps.apple.com/us/app/ntfy/id1625396347" target="_blank" rel="noopener noreferrer">iOS</Link>
                        {', '}
                        <Link className='linkText' href="https://play.google.com/store/apps/details?id=io.heckel.ntfy" target="_blank" rel="noopener noreferrer">Android</Link>,
                        {' or the '}
                        <Link className='linkText' href="https://ntfy.sh/app" target="_blank" rel="noopener noreferrer">web app</Link>
                        {' on the desktop.'}
                    </li>
                    <li>2. Open the app and tap <strong>Subscribe to topic</strong> (the + button).</li>
                    <li>
                        3. For the topic name, enter your household&apos;s ID shown at the top of the main, Laundry
                        or Dishes page and confirm. Leave the server as the default <code>ntfy.sh</code>.
                    </li>
                    <li>4. Done. You&apos;ll get a push notification whenever a laundry load or dishwasher cycle finishes.</li>
                </ol>

                <p className={styles.muted}>
                    Anyone who knows your household&apos;s ID can subscribe to its notifications — ntfy topics
                    aren&apos;t private or password-protected. Don&apos;t share your household ID outside your household.
                </p>
            </div>
        </div>
    )
}
