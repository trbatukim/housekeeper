'use server'

import {createClient} from "@/lib/supabase/server";
import { randomBytes, createHash } from "crypto";
import {redirect} from "next/navigation";

export type APIKeyState = {
    key?: string
    error?: string
}

export async function createAPIKey(_prevState: APIKeyState, formData: FormData): Promise<APIKeyState> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const householdId = formData.get("householdId") as string

    const { data: membership } = await supabase
        .from("profiles_to_households")
        .select("household_id")
        .eq("profile_id", user.id)
        .eq("household_id", householdId)
        .maybeSingle()

    if (!membership) {
        return { error: "You aren't a member of that household" }
    }

    const key = randomBytes(32).toString("hex")
    const hash = createHash("sha256").update(key).digest("hex")

    const { error } = await supabase
        .from("api_keys")
        .upsert(
            { profile_id: user.id, household_id: householdId, token_hash: hash },
            { onConflict: "profile_id,household_id" }
        )

    if (error) {
        return { error: error.message }
    }

    return { key }
}
