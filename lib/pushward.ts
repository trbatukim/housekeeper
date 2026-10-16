import "server-only"
import { getAdmin } from "@/lib/supabase/admin"
import { decrypt } from "@/lib/crypto"

export enum ActivityType {
    LAUNDRY = "Laundry",
    DISHWASHER = "Dishwasher",
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

function activitySlug(type: ActivityType, loadId: string) {
    return `${type.toLowerCase()}-${loadId}`
}

async function sendForAll(
    keys: string[],
    method: "POST" | "PATCH",
    path: string,
    contentType: string,
    body: object
) {
    const results = await Promise.allSettled(
        keys.map(async (key) => {
            const res = await fetch(`https://api.pushward.app${path}`, {
                method,
                headers: {
                    Authorization: `Bearer ${key}`,
                    "Content-Type": contentType,
                },
                body: JSON.stringify(body),
            })
            if (!res.ok) {
                throw new Error(`${res.status} ${await res.text()}`)
            }
        })
    )

    results.forEach((r) => {
        if (r.status === "rejected") console.error("PushWard failed:", r.reason)
    })
}

async function postForAll(keys: string[], body: { slug: string; name: string }) {
    await sendForAll(keys, "POST", "/activities", "application/json", body)
}

async function patchForAll(keys: string[], slug: string, body: object) {
    await sendForAll(keys, "PATCH", `/activities/${slug}?upsert=true`, "application/merge-patch+json", body)
}

export async function createLiveActivity(
    type: ActivityType,
    endsAt: Date,
    householdId: string,
    loadId: string,
) {
    const keys = await getHouseholdKeys(householdId)
    if (keys.length === 0) return

    const slug = activitySlug(type, loadId)
    const toUnix = (d: Date) => Math.floor(d.getTime() / 1000)

    await postForAll(keys, { slug, name: type })

    await patchForAll(keys, slug, {
        state: "ongoing",
        content: {
            template: "countdown",
            state: "Running",
            subtitle: type,
            progress: 0,
            start_date: toUnix(new Date()),
            end_date: toUnix(endsAt),
            completion_message: `Done!`,
            icon: "timer",
            accent_color: "blue",
            alarm: false,
            warning_threshold: 300,
        },
    })
}

export async function deleteLiveActivity(type: ActivityType, householdId: string, loadId: string) {
    const keys = await getHouseholdKeys(householdId)
    if (keys.length === 0) return

    await patchForAll(keys, activitySlug(type, loadId), {
        state: "ended",
        dismissal_ttl: 0,
    })
}