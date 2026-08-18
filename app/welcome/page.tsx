import Link from 'next/link'
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome"
}

export default async function WelcomePage() {
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
            </div>
        </div>
    )
}