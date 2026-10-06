import {authenticate, getAllContentFromTable, isFilled, TableType} from "@/lib/api";
import {parseDueDate} from "@/lib/dates";
import {CURRENCY_VALUES} from "@/lib/currencies";
import {TEXT_MAX_LENGTH} from "@/lib/textLimits";

export async function POST(req: Request): Promise<Response> {
    const caller = await authenticate(req)
    if (caller instanceof Response) {
        return caller
    }

    const { db, household } = caller

    const body = await req.json().catch(() => ({}))

    if (!isFilled(body.description) || !isFilled(body.price) || !isFilled(body.currency) || !isFilled(body.type) || !isFilled(body.due_date)) {
        return Response.json({ error: "Fill in description, price, currency, type, and due_date (dd.mm.yyyy) fields, bad request" }, { status: 400 })
    }

    const description = String(body.description).trim()

    if (!description) {
        return Response.json({ error: "Description cannot be empty" }, { status: 400 })
    }

    if (description.length > TEXT_MAX_LENGTH) {
        return Response.json({ error: `Description cannot exceed ${TEXT_MAX_LENGTH} characters` }, { status: 400 })
    }

    const price = Number(body.price)

    if (!Number.isFinite(price)) {
        return Response.json({ error: "Price is not a number" }, { status: 400 })
    }

    if (price <= 0) {
        return Response.json({ error: "Price must be greater than 0" }, { status: 400 })
    }

    if (!CURRENCY_VALUES.includes(body.currency)) {
        return Response.json({ error: `Currency must be one of: ${CURRENCY_VALUES.join(', ')}` }, { status: 400 })
    }

    if (body.type !== 'recurring' && body.type !== 'one-time') {
        return Response.json({ error: "Type must be 'recurring' or 'one-time'" }, { status: 400 })
    }

    const dueDate = parseDueDate(body.due_date)

    if (!dueDate) {
        return Response.json({ error: "Due date must be a real date in dd.mm.yyyy format" }, { status: 400 })
    }

    const todayStr = new Date().toISOString().split('T')[0]

    if (dueDate < todayStr) {
        return Response.json({ error: "Due date cannot be in the past." }, { status: 400 })
    }

    const { data: existing } = await db
        .from("expenses")
        .select("id")
        .eq("household_id", household.id)
        .eq("paid_on", dueDate)
        .eq("currency", body.currency)
        .ilike("description", description)
        .maybeSingle()

    if (existing) {
        return Response.json({ error: `"${description}" is already logged for that date.` }, { status: 409 })
    }

    const { error } = await db
        .from("expenses")
        .insert({
            household_id: household.id,
            description: description,
            amount: price,
            category: body.type,
            currency: body.currency,
            paid_on: dueDate,
        })

    if (error) {
        console.error("Couldn't add expense:", error)
        return Response.json({ error: "Couldn't add expense" }, { status: 500 })
    }

    return Response.json({ ok: true }, { status: 200 })
}

export async function GET(req: Request): Promise<Response> {
    return getAllContentFromTable(req, TableType.EXPENSES)
}
