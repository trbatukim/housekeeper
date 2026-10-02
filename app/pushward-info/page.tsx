import type {Metadata} from "next";
import Link from "next/link";
import styles from "./pushward-info.module.css";
import {createClient} from "@/lib/supabase/server";
import {redirect} from "next/navigation";
import {clearAPIKey, updateAPIKey} from "@/app/pushward-info/actions";

export const metadata: Metadata = {
    title: "PushWard Info"
}

export default async function PushwardInfoPage({
   searchParams
}: {
    searchParams: Promise<{ error?: string, saved?: string, cleared?: string }>
}) {
    const { error: errorMessage, saved, cleared } = await searchParams

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="container infoPage">
            <Link href='/' className="backButton">&larr; Back to Home</Link>
            <h1 className="title">PushWard Info</h1>

            <div className={styles.keySection}>
                <label className={styles.keyLabel} htmlFor="key">Your PushWard integration key</label>
                <div className={styles.keyRow}>
                    <form className={styles.keyForm} action={updateAPIKey}>
                        <input
                            id="key"
                            name="key"
                            className={`input ${styles.keyInput}`}
                            type="text"
                            placeholder="hlk_…"
                            autoComplete="off"
                        />
                        <button type="submit" className="button">Submit</button>
                    </form>
                    <form action={clearAPIKey}>
                        <button type="submit" className="button">Clear key</button>
                    </form>
                </div>
            </div>

            {errorMessage && <p className="error">{errorMessage}</p>}
            {saved && <p className="success">Key saved!</p>}
            {cleared && <p className="success">Key cleared!</p>}

            <div className="contentBox" style={{ marginBottom: 60 }}>
                <p>
                    Housekeeper can show laundry and dishwasher cycles as a live countdown on your
                    iPhone&apos;s Lock Screen and Dynamic Island through{' '}
                    <Link className='linkText' href="https://pushward.app" target="_blank" rel="noopener noreferrer">PushWard</Link>.
                    Unlike the ntfy notifications, this needs a key from your own PushWard account, since
                    the activity is pushed straight to your devices.
                </p>

                <ol className={styles.steps}>
                    <li>
                        1. Install PushWard from the{' '}
                        <Link className='linkText' href="https://apps.apple.com/us/app/pushward/id6759689999" target="_blank" rel="noopener noreferrer">App Store</Link>.
                        {' '}It&apos;s an Apple-only service there&apos;s no Android version.
                    </li>
                    <li>2. Open the app and sign in with Apple. There&apos;s no email or password to set up.</li>
                    <li>
                        3. Go to <strong>Settings &rarr; Integration Keys</strong> and create a key with the{' '}
                        <code>activity:manage</code> scope. Live Activities need an active PushWard subscription.
                    </li>
                    <li>
                        4. Copy the key it starts with <code>hlk_</code> and paste it into the field above,
                        then hit <strong>Submit</strong>.
                    </li>
                    <li>
                        5. Done. Whenever anyone in your household starts a laundry load or dishwasher cycle,
                        a countdown appears on your Lock Screen and ends on its own when the cycle finishes or
                        is cleared.
                    </li>
                </ol>

                <p className={styles.muted}>
                    Keys are per person, not per household each member who wants live countdowns has to add
                    their own. Your key is stored encrypted and is only used to push activities for your
                    household&apos;s cycles. <strong>Clear key</strong> deletes it and stops the countdowns.
                </p>
            </div>
        </div>
    )
}
