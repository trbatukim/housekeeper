import "server-only"
import { createClient as createAdminClient, type SupabaseClient } from "@supabase/supabase-js"
import { decrypt } from "@/lib/crypto"

export enum ActivityType {
    LAUNDRY = "Laundry",
    DISHWASHER = "Dishwasher",
}

let admin: SupabaseClient | null = null

function getAdmin() {
    if (admin) return admin

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceRoleKey) {
        throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    }

    admin = createAdminClient(url, serviceRoleKey)
    return admin
}

async function getHouseholdKeys(householdId: string): Promise<string[]> {
    const admin = getAdmin()

    const { data: members, error } = await admin
        .from("profiles_to_households")
        .select("profile_id")
        .eq("household_id", householdId)

    if (error || !members) {
        console.error("Couldn't load household members:", error)
        return []
    }

    const profileIds = members.map((m) => m.profile_id)

    const { data: rows, error: keyError } = await admin
        .from("pushward_keys")
        .select("encrypted_key")
        .in("profile_id", profileIds)

    if (keyError || !rows) {
        console.error("Couldn't load PushWard keys:", keyError)
        return []
    }

    return rows.map((r) => decrypt(r.encrypted_key))
}

async function patchForAll(keys: string[], slug: string, body: object) {
    const results = await Promise.allSettled(
        keys.map(async (key) => {
            const res = await fetch(
                `https://api.pushward.app/activities/${slug}?upsert=true`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${key}`,
                        "Content-Type": "application/merge-patch+json",
                    },
                    body: JSON.stringify(body),
                }
            )
            if (!res.ok) {
                throw new Error(`${res.status} ${await res.text()}`)
            }
        })
    )

    results.forEach((r) => {
        if (r.status === "rejected") console.error("PushWard failed:", r.reason)
    })
}

export async function createLiveActivity(
    type: ActivityType,
    endsAt: Date,
    householdId: string
) {
    const keys = await getHouseholdKeys(householdId)
    if (keys.length === 0) return

    const toUnix = (d: Date) => Math.floor(d.getTime() / 1000)

    await patchForAll(keys, `${type.toLowerCase()}-timer`, {
        state: "ongoing",
        content: {
            template: "countdown",
            state: "Running",
            subtitle: type,
            progress: 0,
            start_date: toUnix(new Date()),
            end_date: toUnix(endsAt),
            completion_message: `${type} done!`,
            icon: "timer",
            accent_color: "blue",
            alarm: false,
            warning_threshold: 300,
        },
    })
}

export async function deleteLiveActivity(type: ActivityType, householdId: string) {
    const keys = await getHouseholdKeys(householdId)
    if (keys.length === 0) return

    await patchForAll(keys, `${type.toLowerCase()}-timer`, {
        state: "ended",
        dismissal_ttl: 0,
    })
}