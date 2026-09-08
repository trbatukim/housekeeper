import Link from 'next/link'
import type { Metadata } from "next";
import { startDemo } from '../demo/actions'

export const metadata: Metadata = {
  title: "Welcome"
}

export default async function WelcomePage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>
}) {
    const { error: errorMessage } = await searchParams

    return (
        <div className="container">
            <h1 className="titleRow">
                <span className="title">Welcome to</span> <span className="logo">HouseKeeper</span>
            </h1>
            <div className="contentBox">
                <div className="buttonRow">
                    <Link href="/signup" className="link">Sign-Up</Link>
                    <Link href="/login" className="link">Login</Link>
                </div>
                <form action={startDemo}>
                    <button type="submit" className="link">Explore Demo</button>
                </form>
                {errorMessage && <p className="error">{errorMessage}</p>}
            </div>
        </div>
    )
}