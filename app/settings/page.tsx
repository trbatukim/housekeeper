import {createClient} from "@/lib/supabase/server";
import {redirect} from "next/navigation";
import APIKeyItem from "./APIKeyItem";
import styles from "./settings.module.css";
import Link from "next/link";

export default async function SettingsPage({searchParams}: {searchParams: Promise<{ error?: string }>}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error: errorMessage } = await searchParams

    if (!user) {
        redirect('/login')
    }

    const { data: households, error } = await supabase
        .from("households")
        .select()

    if (error) {
        console.error("Couldn't load households:", error)
    }

    return (
        <div className="container">
            <Link href="/" className="backButton">&larr; Back</Link>
            <h1 className="title">Settings</h1>

            {errorMessage && <p className="error">{errorMessage}</p>}

            <div className="contentBox">
                {households && households.length > 0 ? (
                    <>
                        <p>Your API keys for:</p>
                        <ul className={styles.keyList}>
                            {households.map((h) => (
                                <li key={h.id} className={styles.keyItem}>
                                    <APIKeyItem household={h} />
                                </li>
                            ))}
                        </ul>
                    </>
                ) : (
                    <p>You aren&apos;t a member of any households.</p>
                )}
            </div>
        </div>
    )
}