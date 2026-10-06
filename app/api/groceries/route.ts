import {authenticate, deleteContentFromTable, getAllContentFromTable, hasDuplicate, isFilled, isUuid, TableType} from "@/lib/api"

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

    const duplicate = await hasDuplicate(db, TableType.GROCERIES, "name", String(body.name), { household_id: household.id })

    if (duplicate instanceof Response) {
        return duplicate
    }

    if (duplicate) {
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

    return Response.json({ ok: true })
}

export async function DELETE(req: Request): Promise<Response> {
    const caller = await authenticate(req)
    if (caller instanceof Response) {
        return caller
    }

    const { db, household } = caller

    const body = await req.clone().json().catch(() => ({}))

    if (!isFilled(body.name)) {
        return deleteContentFromTable(req, TableType.GROCERIES)
    }

    const { data, error } = await db
        .from("grocery_items")
        .delete()
        .eq("name", body.name)
        .eq("household_id", household.id)
        .select()

    if (error) {
        console.error("Couldn't delete grocery:", error)
        return Response.json({ error: "Couldn't delete grocery" }, { status: 500 })
    }

    return Response.json({ deleted: data }, { status: 200 })
}

export async function GET(req: Request): Promise<Response> {
    return getAllContentFromTable(req, TableType.GROCERIES)
}

export async function PUT(req: Request): Promise<Response> {
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

    const updates: { name?: string, amount?: number, amount_type?: string } = {}

    if (isFilled(body.name)) {
        updates.name = body.name
    }

    if (isFilled(body.amount)) {
        const amount = Number(body.amount)

        if (!Number.isFinite(amount)) {
            return Response.json({ error: "Amount is not a number" }, { status: 400 })
        }

        updates.amount = amount
    }

    if (isFilled(body.amount_type)) {
        updates.amount_type = body.amount_type
    }

    if (Object.keys(updates).length === 0) {
        return Response.json({ error: "Fill in at least one of name, amount, or amount_type fields, bad request" }, { status: 400 })
    }

    const { data: item, error: databaseError } = await db
        .from("grocery_items")
        .select("id")
        .eq("id", body.id)
        .eq("household_id", household.id)
        .maybeSingle()

    if (databaseError) {
        console.error("Couldn't get grocery:", databaseError)
        return Response.json({ error: "Couldn't get item due to database error" }, { status: 500 })
    }

    if (!item) {
        return Response.json({ error: "Item you're trying to edit does not exist" }, { status: 404 })
    }

    if (updates.name !== undefined) {
        const duplicate = await hasDuplicate(db, TableType.GROCERIES, "name", updates.name, { household_id: household.id }, body.id)

        if (duplicate instanceof Response) {
            return duplicate
        }

        if (duplicate) {
            return Response.json({ error: `"${updates.name}" is already on the list.` }, { status: 409 })
        }
    }

    const { data: updated, error } = await db
        .from("grocery_items")
        .update(updates)
        .eq("id", body.id)
        .eq("household_id", household.id)
        .select()

    if (error) {
        console.error("Couldn't update grocery:", error)
        return Response.json({ error: "Couldn't update grocery" }, { status: 500 })
    }

    return Response.json({ updated }, { status: 200 })
}
