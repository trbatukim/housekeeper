import { authenticate, isFilled } from "@/lib/api"

export async function POST(req: Request): Promise<Response> {
    const caller = await authenticate(req)
    if (caller instanceof Response) {
        return caller
    }

    const { db, household, profileId } = caller

    const body = await req.json().catch(() => ({}))

    if (!isFilled(body.name) || !isFilled(body.amount) || !isFilled(body.amount_type)) {
        return Response.json({ error: "Fill in name, amount, and amount_type fields, bad request" }, { status: 400 })
    }

    const amount = Number(body.amount)

    if (!Number.isFinite(amount)) {
        return Response.json({ error: "Amount is not a number" }, { status: 400 })
    }

    const { data: existing } = await db
        .from("grocery_items")
        .select("id")
        .eq("household_id", household.id)
        .ilike("name", body.name)
        .maybeSingle()

    if (existing) {
        return Response.json({ error: `"${body.name}" is already on the list.` }, { status: 409 })
    }

    const { error } = await db
        .from("grocery_items")
        .insert({
            household_id: household.id,
            name: body.name,
            added_by: profileId,
            amount: amount,
            amount_type: body.amount_type,
        })

    if (error) {
        console.error("Couldn't add grocery:", error)
        return Response.json({ error: "Couldn't add grocery" }, { status: 500 })
    }

    return Response.json({ ok: true }, { status: 200 })
}
