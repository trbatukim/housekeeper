import {SupabaseClient} from "@supabase/supabase-js";
import {DatabaseError} from "@/core/errors/database.error";
import {TableType} from "@/lib/supabase/tables";

export type GroceryType = {
    id: string
    household_id: string
    name: string
    amount: number | null
    amount_type: string | null
    is_purchased: boolean
    added_by: string | null
    created_at: string
}

export type NewGroceryType = Omit<GroceryType, "id" | "is_purchased" | "created_at">

export async function findAll(db: SupabaseClient, householdId: string): Promise<GroceryType[]> {
    const { data, error } = await db
        .from(TableType.GROCERIES)
        .select()
        .eq("household_id", householdId);

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

// export async function update(db: SupabaseClient, id: string, householdId: string);

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

export async function nameExists(db: SupabaseClient, name: string, householdId: string): Promise<boolean> {
    const { data, error } = await db
        .from(TableType.GROCERIES)
        .select()
        .eq("household_id", householdId)
        .eq("name", name)
        .maybeSingle()

    if (error) {
        console.error("Couldn't search groceries: ", error)
        throw new DatabaseError("Database search query failed");
    }

    return data !== null;
}