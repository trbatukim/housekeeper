import {createClient as createAdminClient, type SupabaseClient} from "@supabase/supabase-js";

let admin: SupabaseClient | null = null

export function getAdmin() {
    if (admin) return admin

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceRoleKey) {
        throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    }

    admin = createAdminClient(url, serviceRoleKey)
    return admin
}