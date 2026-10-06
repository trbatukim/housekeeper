import "server-only"
import {createHash} from "crypto";
import {type SupabaseClient} from "@supabase/supabase-js";
import {getAdmin} from "@/lib/supabase/admin";
import {ActivityType, createLiveActivity} from "@/lib/pushward";
import {cancelNtfyReq, sendNtfyReq} from "@/lib/ntfy";
import {computeDurationSeconds, isValidDuration} from "@/lib/duration";

const DEFAULT_DURATION_MINUTES = 120

export const isFilled = (value: unknown) => value !== undefined && value !== null && value !== ''

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const isUuid = (value: unknown) => typeof value === "string" && UUID_PATTERN.test(value)

type Household = { id: string, name: string }

type Caller = { db: SupabaseClient, household: Household, profileId: string }

type LoadConfig = {
    table: string
    activityType: ActivityType
    doneMessage: string
    onStarted?: (db: SupabaseClient, householdId: string) => Promise<void>
}

export enum TableType {
    GROCERIES = "grocery_items",
    EXPENSES = "expenses",
    LAUNDRY = "laundry_loads",
    DISHWASHER = "dishwasher_loads",
}

export async function authenticate(req: Request): Promise<Caller | Response> {
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
        .select("id, name")
        .eq("id", key.household_id)
        .maybeSingle()

    if (householdError) {
        console.error("Couldn't load household:", householdError)
        return Response.json({ error: "Couldn't load household" }, { status: 500 })
    }

    if (!household) {
        return Response.json({ error: "Household not found" }, { status: 404 })
    }

    return { db, household: household as Household, profileId: key.profile_id as string }
}

// Case-insensitive exact match, done in JS because ilike treats % and _ as wildcards
// and maybeSingle errors out when more than one row matches.
export async function hasDuplicate(
    db: SupabaseClient,
    table: TableType,
    column: string,
    value: string,
    filters: Record<string, unknown>,
    excludeId?: string,
): Promise<boolean | Response> {
    let query = db.from(table).select(`id, ${column}`)
    for (const [key, filterValue] of Object.entries(filters)) {
        query = query.eq(key, filterValue)
    }
    if (excludeId) {
        query = query.neq("id", excludeId)
    }

    const { data, error } = await query

    if (error) {
        console.error(`Couldn't check ${table} for duplicates:`, error)
        return Response.json({ error: "Couldn't check for duplicates" }, { status: 500 })
    }

    const target = value.toLowerCase()
    return (data as unknown as Record<string, unknown>[]).some(row => String(row[column]).toLowerCase() === target)
}

export async function startLoad(req: Request, config: LoadConfig): Promise<Response> {
    const caller = await authenticate(req)
    if (caller instanceof Response) {
        return caller
    }

    const { db, household } = caller

    const body = await req.json().catch(() => ({}))
    const hasDuration = body.hours !== undefined || body.minutes !== undefined
    const durationSeconds = hasDuration
        ? computeDurationSeconds(Number(body.hours) || 0, Number(body.minutes) || 0)
        : computeDurationSeconds(0, DEFAULT_DURATION_MINUTES)

    if (!isValidDuration(durationSeconds)) {
        return Response.json({ error: "Set an end time for the load." }, { status: 400 })
    }

    const endsAtDate = new Date(Date.now() + durationSeconds * 1000)
    const endsAt = endsAtDate.toISOString()

    const notificationId = await sendNtfyReq(config.doneMessage, endsAt, household.name, household.id)

    const { error } = await db
        .from(config.table)
        .insert({
            household_id: household.id,
            ends_at: endsAt,
            status: 'running',
            ntfy_seq_id: notificationId ?? null,
        })

    if (error) {
        if (notificationId) {
            await cancelNtfyReq(notificationId, household.id)
        }
        console.error("Couldn't add cycle:", error)
        return Response.json({ error: "Couldn't add cycle" }, { status: 500 })
    }

    await config.onStarted?.(db, household.id)

    await createLiveActivity(config.activityType, endsAtDate, household.id)

    return Response.json({ ok: true, endsAt })
}

export async function getAllContentFromTable(req: Request, table: TableType): Promise<Response> {
    const caller = await authenticate(req)
    if (caller instanceof Response) {
        return caller
    }

    const { db, household } = caller

    const { data, error } = await db
        .from(table)
        .select()
        .eq("household_id", household.id)

    if (error) {
        console.error(`Couldn't get ${table}`, error)
        return Response.json({ error: `Couldn't get ${table}` }, { status: 500 })
    }

    return Response.json({ data }, { status: 200 })
}

export async function deleteContentFromTable(
    req: Request,
    table: TableType,
    onDeleted?: (db: SupabaseClient, householdId: string, rows: Record<string, unknown>[]) => Promise<void>,
): Promise<Response> {
    const caller = await authenticate(req)
    if (caller instanceof Response) {
        return caller
    }

    const { db, household } = caller

    const body = await req.json().catch(() => ({}))

    if (!isFilled(body.id)) {
        return Response.json({ error: "Fill in the id field, bad request" }, { status: 400 })
    }

    if (!isUuid(body.id)) {
        return Response.json({ error: "id must be a valid UUID" }, { status: 400 })
    }

    const { data, error } = await db
        .from(table)
        .delete()
        .eq("household_id", household.id)
        .eq("id", body.id)
        .select()

    if (error) {
        console.error(`Couldn't delete item`, error)
        return Response.json({ error: `Couldn't delete item` }, { status: 500 })
    }

    if (data.length > 0) {
        await onDeleted?.(db, household.id, data)
    }

    return Response.json({ deleted: data }, { status: 200 })
}