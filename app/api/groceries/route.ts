import {authenticate, errorResponse, getAllContentFromTable, isFilled, isUuid} from "@/lib/api"
import {addGrocery, deleteGroceryById, deleteGroceryByName, updateGrocery} from "@/services/grocery-service";
import {TableType} from "@/lib/supabase/tables";

const optionalText = (value: unknown): string | undefined => {
    if (value === undefined || value === null) {
        return undefined
    }
    return typeof value === "string" ? value.trim() : ""
}

export async function POST(req: Request): Promise<Response> {
    const caller = await authenticate(req)
    if (caller instanceof Response) {
        return caller
    }

    const { db, household, profileId } = caller

    const body = await req.json().catch(() => ({}))

    const name = typeof body.name === "string" ? body.name.trim() : ""
    const amount = Number(body.amount)
    const amountType = typeof body.amount_type === "string" ? body.amount_type.trim() : null

    try {
        await addGrocery(db, household.id, profileId, {
            name: name,
            amount: amount,
            amountType: amountType
        })
    } catch (e: unknown) {
        return errorResponse(e)
    }

    return Response.json({ ok: true })
}

export async function DELETE(req: Request): Promise<Response> {
    const caller = await authenticate(req)
    if (caller instanceof Response) {
        return caller
    }

    const { db, household } = caller

    const body = await req.json().catch(() => ({}))

    if (!isFilled(body.name) && !isFilled(body.id)) {
        return Response.json({ error: "Fill in the id field, bad request" }, { status: 400 })
    }

    if (!isFilled(body.name) && !isUuid(body.id)) {
        return Response.json({ error: "id must be a valid UUID" }, { status: 400 })
    }

    try {
        const deleted = isFilled(body.name)
            ? await deleteGroceryByName(db, String(body.name), household.id)
            : await deleteGroceryById(db, body.id, household.id)

        return Response.json({ deleted }, { status: 200 })
    } catch (e: unknown) {
        return errorResponse(e)
    }
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

    const hasAmount = body.amount !== undefined && body.amount !== null

    try {
        const updated = await updateGrocery(db, body.id, household.id, {
            name: optionalText(body.name),
            amount: hasAmount ? Number(body.amount) : undefined,
            amountType: optionalText(body.amount_type),
        })

        return Response.json({ updated: [updated] }, { status: 200 })
    } catch (e: unknown) {
        return errorResponse(e)
    }
}
