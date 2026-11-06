import {SupabaseClient} from "@supabase/supabase-js";
import {DatabaseError} from "@/core/errors/database.error";
import {TableType} from "@/lib/supabase/tables";
import {GroceryType, GroceryUpdate, NewGroceryType} from "@/core/types/grocery";

export async function findAll(db: SupabaseClient, householdId: string): Promise<GroceryType[]> {
    const { data, error } = await db
        .from(TableType.GROCERIES)
        .select()
        .eq("household_id", householdId)
        .order("created_at");

    if (error) {
        console.error("Couldn't get groceries: ", error)
        throw new DatabaseError("Database get all query failed");
    }

    return data;
}

export async function insert(db: SupabaseClient, item: NewGroceryType): Promise<void> {
    const { error } = await db
        .from(TableType.GROCERIES)
        .insert(item);

    if (error) {
        console.error("Couldn't add groceries: ", error)
        throw new DatabaseError("Database add query failed");
    }
}

export async function update(db: SupabaseClient, id: string, householdId: string, updates: GroceryUpdate): Promise<GroceryType | null> {
    const { data, error } = await db
        .from(TableType.GROCERIES)
        .update(updates)
        .eq("id", id)
        .eq("household_id", householdId)
        .select()
        .maybeSingle();

    if (error) {
        console.error("Couldn't update groceries: ", error)
        throw new DatabaseError("Database update query failed");
    }

    return data;
}

export async function deleteById(db: SupabaseClient, id: string, householdId: string): Promise<void> {
    const { error } = await db
        .from(TableType.GROCERIES)
        .delete()
        .eq("household_id", householdId)
        .eq("id", id)
        .select()
        .maybeSingle();

    if (error) {
        console.error("Couldn't delete groceries: ", error)
        throw new DatabaseError("Database delete query failed");
    }
}

export async function deleteByName(db: SupabaseClient, name: string, householdId: string): Promise<void> {
    const { error } = await db
        .from(TableType.GROCERIES)
        .delete()
        .eq("household_id", householdId)
        .eq("name", name)
        .select()
        .maybeSingle();

    if (error) {
        console.error("Couldn't delete groceries: ", error)
        throw new DatabaseError("Database delete query failed");
    }
}

export async function deletePurchased(db: SupabaseClient, householdId: string): Promise<void> {
    const { error } = await db
        .from(TableType.GROCERIES)
        .delete()
        .eq("household_id", householdId)
        .eq("is_purchased", true);

    if (error) {
        console.error("Couldn't clear purchased groceries: ", error);
        throw new DatabaseError("Database clear purchased query failed");
    }
}

export async function deleteAll(db: SupabaseClient, householdId: string): Promise<void> {
    const { error } = await db
        .from(TableType.GROCERIES)
        .delete()
        .eq("household_id", householdId);

    if (error) {
        console.error("Couldn't delete all groceries: ", error);
        throw new DatabaseError("Database delete all query failed");
    }
}

// Case-insensitive exact match, done in JS because ilike treats % and _ as wildcards
// and maybeSingle errors out when more than one row matches.
export async function nameExists(db: SupabaseClient, name: string, householdId: string, excludeId?: string): Promise<boolean> {
    let query = db
        .from(TableType.GROCERIES)
        .select("name")
        .eq("household_id", householdId)

    if (excludeId) {
        query = query.neq("id", excludeId)
    }

    const { data, error } = await query

    if (error) {
        console.error("Couldn't search groceries: ", error)
        throw new DatabaseError("Database search query failed");
    }

    const target = name.toLowerCase()
    return data.some(row => row.name.toLowerCase() === target)
}

