import { NAME_MAX_LENGTH } from '@/lib/textLimits';
import {InputTooLongError, EmptyFieldError, NaNFieldError, NotFiniteError} from '@/core/errors/validation.error';
import {SupabaseClient} from "@supabase/supabase-js";
import {insert, nameExists, update} from "@/repositories/grocery-repository";
import {DuplicateError} from "@/core/errors/conflict.error";
import {GroceryType, GroceryUpdate} from "@/core/types/grocery";
import {NotFoundError} from "@/core/errors/not-found.error";

export function validateGroceryName(name: string) {
    if (!name) throw new EmptyFieldError("Grocery name cannot be empty");
    if (name.length > NAME_MAX_LENGTH) throw new InputTooLongError("Grocery name is too long");
}

export function validateAmount(amount: number) {
    if (Number.isNaN(amount)) throw new NaNFieldError("Amount must be a number");
    if (!Number.isFinite(amount)) throw new NotFiniteError("Amount must be finite")
    if (amount === 0) throw new EmptyFieldError("Amount cannot be empty")
}

export function validateAmountType(amountType: string | null | undefined) {
    if (!amountType) throw new EmptyFieldError("Amount type cannot be empty");
    if (amountType.length > NAME_MAX_LENGTH) throw new InputTooLongError("Amount type name is too long");
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

    if (Object.keys(updates).length === 0) {
        throw new EmptyFieldError("Fill in at least one of name, amount, or amount_type");
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