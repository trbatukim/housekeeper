import { NAME_MAX_LENGTH } from '@/lib/textLimits';
import {ValidationError} from '@/core/errors/validation.error';
import {SupabaseClient} from "@supabase/supabase-js";
import {deleteAll, deleteById, deleteByName, deletePurchased, insert, nameExists, update} from "@/repositories/grocery-repository";
import {DuplicateError} from "@/core/errors/conflict.error";
import {GroceryType, GroceryUpdate} from "@/core/types/grocery";
import {NotFoundError} from "@/core/errors/not-found.error";

export function validateGroceryName(name: string) {
    if (!name) throw new ValidationError("Grocery name cannot be empty");
    if (name.length > NAME_MAX_LENGTH) throw new ValidationError("Grocery name is too long");
}

export function validateAmount(amount: number) {
    if (Number.isNaN(amount)) throw new ValidationError("Amount must be a number");
    if (!Number.isFinite(amount)) throw new ValidationError("Amount must be finite")
    if (amount === 0) throw new ValidationError("Amount cannot be empty")
}

export function validateAmountType(amountType: string | null | undefined) {
    if (!amountType) throw new ValidationError("Amount type cannot be empty");
    if (amountType.length > NAME_MAX_LENGTH) throw new ValidationError("Amount type name is too long");
}

export function validateGrocery(input: {
    name: string,
    amount: number,
    amountType: string | null | undefined
}): void {
    validateGroceryName(input.name);
    validateAmount(input.amount);
    validateAmountType(input.amountType);
}

export async function addGrocery(db: SupabaseClient, householdId: string, profileId: string, input: {
    name: string,
    amount: number,
    amountType: string | null | undefined
}): Promise<void> {
    validateGrocery(input);

    if (await nameExists(db, input.name, householdId)) {
        throw new DuplicateError(`"${input.name}" is already on the list.`);
    }

    await insert(db, {
        household_id: householdId,
        name: input.name,
        amount: input.amount,
        amount_type: input.amountType ?? null,
        added_by: profileId
    });
}

export async function updateGrocery(db: SupabaseClient, id: string, householdId: string, input: {
    name?: string,
    amount?: number,
    amountType?: string | null,
    isPurchased?: boolean,
}): Promise<GroceryType> {
    const updates: GroceryUpdate = {};

    if (input.name !== undefined) {
        validateGroceryName(input.name);
        updates.name = input.name;
    }
    if (input.amount !== undefined) {
        validateAmount(input.amount);
        updates.amount = input.amount;
    }
    if (input.amountType !== undefined) {
        validateAmountType(input.amountType);
        updates.amount_type = input.amountType;
    }
    if (input.isPurchased !== undefined) {
        updates.is_purchased = input.isPurchased;
    }

    if (Object.keys(updates).length === 0) {
        throw new ValidationError("Fill in at least one of name, amount, or amount_type");
    }

    if (updates.name !== undefined && await nameExists(db, updates.name, householdId, id)) {
        throw new DuplicateError(`"${updates.name}" is already on the list.`);
    }

    const updated = await update(db, id, householdId, updates);
    if (!updated) {
        throw new NotFoundError("Item you're trying to edit does not exist");
    }

    return updated;
}

export async function deleteGroceryById(db: SupabaseClient, id: string, householdId: string): Promise<GroceryType[]> {
    return deleteById(db, id, householdId);
}

// Exact, case-sensitive match on the stored name.
export async function deleteGroceryByName(db: SupabaseClient, name: string, householdId: string): Promise<GroceryType[]> {
    return deleteByName(db, name, householdId);
}

export async function clearPurchasedGroceries(db: SupabaseClient, householdId: string): Promise<void> {
    await deletePurchased(db, householdId);
}

export async function clearAllGroceries(db: SupabaseClient, householdId: string): Promise<void> {
    await deleteAll(db, householdId);
}