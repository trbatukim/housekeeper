import {authenticate, deleteContentFromTable, getAllContentFromTable, hasDuplicate, isFilled, isUuid, TableType} from "@/lib/api";
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

    if (!isFilled(body.description) || !isFilled(body.amount) || !isFilled(body.currency) || !isFilled(body.type) || !isFilled(body.due_date)) {
        return Response.json({ error: "Fill in description, amount, currency, type, and due_date (dd.mm.yyyy) fields, bad request" }, { status: 400 })
    }

    const description = String(body.description).trim()

    if (!description) {
        return Response.json({ error: "Description cannot be empty" }, { status: 400 })
    }

    if (description.length > TEXT_MAX_LENGTH) {
        return Response.json({ error: `Description cannot exceed ${TEXT_MAX_LENGTH} characters` }, { status: 400 })
    }

    const amount = Number(body.amount)

    if (!Number.isFinite(amount)) {
        return Response.json({ error: "amount is not a number" }, { status: 400 })
    }

    if (amount <= 0) {
        return Response.json({ error: "amount must be greater than 0" }, { status: 400 })
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
            amount: amount,
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

export async function DELETE(req: Request): Promise<Response> {
    const caller = await authenticate(req)
    if (caller instanceof Response) {
        return caller
    }

    const { db, household } = caller

    const body = await req.clone().json().catch(() => ({}))

    if (!isFilled(body.description)) {
        return deleteContentFromTable(req, TableType.EXPENSES)
    }

    const { data, error } = await db
        .from("expenses")
        .delete()
        .eq("description", body.description)
        .eq("household_id", household.id)
        .select()

    if (error) {
        console.error("Couldn't delete item:", error)
        return Response.json({ error: "Couldn't delete item" }, { status: 500 })
    }

    return Response.json({ deleted: data }, { status: 200 })
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

    const updates: { description?: string, amount?: number, category?: string, currency?: string, paid_on?: string } = {}

    if (isFilled(body.description)) {
        const description = String(body.description).trim()

        if (!description) {
            return Response.json({ error: "Description cannot be empty" }, { status: 400 })
        }

        if (description.length > TEXT_MAX_LENGTH) {
            return Response.json({ error: `Description cannot exceed ${TEXT_MAX_LENGTH} characters` }, { status: 400 })
        }

        updates.description = description
    }

    if (isFilled(body.amount)) {
        const amount = Number(body.amount)

        if (!Number.isFinite(amount)) {
            return Response.json({ error: "amount is not a number" }, { status: 400 })
        }

        if (amount <= 0) {
            return Response.json({ error: "amount must be greater than 0" }, { status: 400 })
        }

        updates.amount = amount
    }

    if (isFilled(body.type)) {
        if (body.type !== "recurring" && body.type !== "one-time") {
            return Response.json({ error: "Type must be 'recurring' or 'one-time'" }, { status: 400 })
        }

        updates.category = body.type
    }

    if (isFilled(body.currency)) {
        if (!CURRENCY_VALUES.includes(body.currency)) {
            return Response.json({ error: `Currency must be one of: ${CURRENCY_VALUES.join(', ')}` }, { status: 400 })
        }

        updates.currency = body.currency
    }

    if (isFilled(body.due_date)) {
        const dueDate = parseDueDate(body.due_date)

        if (!dueDate) {
            return Response.json({ error: "Due date must be a real date in dd.mm.yyyy format" }, { status: 400 })
        }

        const todayStr = new Date().toISOString().split('T')[0]

        if (dueDate < todayStr) {
            return Response.json({ error: "Due date cannot be in the past." }, { status: 400 })
        }

        updates.paid_on = dueDate
    }

    if (Object.keys(updates).length === 0) {
        return Response.json({ error: "Fill in at least one of description, amount, currency, type, or due_date fields, bad request" }, { status: 400 })
    }

    const { data: expense, error: databaseError } = await db
        .from("expenses")
        .select("id, description, paid_on, currency")
        .eq("id", body.id)
        .eq("household_id", household.id)
        .maybeSingle()

    if (databaseError) {
        console.error("Couldn't get expense:", databaseError)
        return Response.json({ error: "Couldn't get item due to database error" }, { status: 500 })
    }

    if (!expense) {
        return Response.json({ error: "Expense you're trying to edit does not exist" }, { status: 404 })
    }

    if (updates.description !== undefined || updates.paid_on !== undefined || updates.currency !== undefined) {
        const description = updates.description ?? expense.description
        const paidOn = updates.paid_on ?? expense.paid_on

        const duplicate = await hasDuplicate(db, TableType.EXPENSES, "description", description, {
            household_id: household.id,
            paid_on: paidOn,
            currency: updates.currency ?? expense.currency,
        }, body.id)

        if (duplicate instanceof Response) {
            return duplicate
        }

        if (duplicate) {
            return Response.json({ error: `"${description}" is already logged for that date.` }, { status: 409 })
        }
    }

    const { data: updated, error } = await db
        .from("expenses")
        .update(updates)
        .eq("id", body.id)
        .eq("household_id", household.id)
        .select()

    if (error) {
        console.error("Couldn't update expense:", error)
        return Response.json({ error: "Couldn't update expense" }, { status: 500 })
    }

    return Response.json({ updated }, { status: 200 })
}
