'use server'
import {createClient} from "@/lib/supabase/server";
import {encrypt} from "@/lib/crypto";
import {redirect} from "next/navigation";

export async function updateAPIKey(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const key = (formData.get("key") as string | null)?.trim()
    if (!key || !key.startsWith("hlk_")) {
        redirect("/pushward-info?error=" + encodeURIComponent("This isn't a PushWard key"))
    }
    const encrypted: string = encrypt(key)

    const { error } = await supabase
        .from('pushward_keys')
        .upsert(
            { profile_id: user.id, encrypted_key: encrypted },
            { onConflict: "profile_id" }
        )

    if (error) {
        redirect(`/pushward-info?error=${encodeURIComponent(error.message)}`)
    }

    redirect("/pushward-info?saved=1")
}