import { NAME_MAX_LENGTH } from '@/lib/textLimits';
import {InputTooLongError, EmptyFieldError, NaNFieldError, NotFiniteError} from '@/core/errors/validation.error';

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