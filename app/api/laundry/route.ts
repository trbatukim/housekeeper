import { createHash } from "crypto"
import { getAdmin } from "@/lib/supabase/admin"
import { createLiveActivity, ActivityType } from "@/lib/pushward"
import {cancelNtfyReq, sendNtfyReq} from "@/lib/ntfy";
import { computeDurationSeconds, isValidDuration } from "@/lib/duration"

export async function POST(req: Request) {
    const token = req.headers.get("authorization")?.replace("Bearer ", "").trim()
    if (!token) {
        return Response.json({ error: "Missing API key" }, { status: 401 })
    }

    const hash = createHash("sha256").update(token).digest("hex")
    const db = getAdmin()

    const { data: key } = await db
        .from("api_keys")
        .select("profile_id, household_id")
        .eq("token_hash", hash)
        .maybeSingle()

    if (!key) {
        return Response.json({ error: "Invalid API key" }, { status: 401 })
    }

    const { data: member } = await db
        .from("profiles_to_households")
        .select("profile_id")
        .eq("profile_id", key.profile_id)
        .eq("household_id", key.household_id)
        .maybeSingle()

    if (!member) {
        return Response.json({ error: "Not a member of this household" }, { status: 403 })
    }

    const { data: household, error: householdError } = await db
        .from("households")
        .select("name")
        .eq("id", key.household_id)
        .maybeSingle()

    if (householdError) {
        console.error("Couldn't load household:", householdError)
        return Response.json({ error: "Couldn't load household" }, { status: 500 })
    }

    if (!household) {
        return Response.json({ error: "Household not found" }, { status: 404 })
    }

    const householdId = key.household_id as string
    const householdName = household.name as string

    const body = await req.json().catch(() => ({}))
    const hours = Number(body.hours) || 0
    const minutes = Number(body.minutes) || 0
    const hasDuration = body.hours !== undefined || body.minutes !== undefined
    const durationSeconds = hasDuration
        ? computeDurationSeconds(hours, minutes)
        : computeDurationSeconds(0, 120)

    if (!isValidDuration(durationSeconds)) {
        return Response.json({ error: "Set an end time for the load." }, { status: 400 })
    }

    const endsAtDate = new Date(Date.now() + durationSeconds * 1000)
    const endsAt = endsAtDate.toISOString()

    const notificationId = await sendNtfyReq("Laundry done!", endsAt, householdName, householdId)

    const { error } = await db
        .from('laundry_loads')
        .insert({
            household_id: householdId,
            ends_at: endsAt,
            status: 'running',
            ntfy_seq_id: notificationId ?? null,
        })

    if (error) {
        if (notificationId) {
            cancelNtfyReq(notificationId, householdId)
        }
        console.error("Couldn't add cycle:", error)
        return Response.json({ error: "Couldn't add cycle" }, { status: 500 })
    }

    await createLiveActivity(ActivityType.LAUNDRY, endsAtDate, householdId)

    return Response.json({ ok: true, endsAt })
}
