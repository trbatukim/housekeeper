import { NAME_MAX_LENGTH } from '@/lib/textLimits';
import {InputTooLongError, EmptyFieldError, NaNFieldError, NotFiniteError} from '@/core/errors/validation.error';

export function validateGrocery(input: {
    name: string,
    amount: number,
    amountType: string | null | undefined
}): void {

    // Checks regarding name of grocery
    if (!input.name || input.name === "") throw new EmptyFieldError("Grocery name cannot be empty");
    if (input.name.length > NAME_MAX_LENGTH) throw new InputTooLongError("Grocery name is too long");

    // Amount type checks
    if (!input.amountType) throw new EmptyFieldError("Amount type cannot be empty");
    if (input.amountType.length > NAME_MAX_LENGTH) throw new InputTooLongError("Amount type name is too long");

    // Amount checks
    if (!input.amount) throw new EmptyFieldError("Amount cannot be empty")
    if (Number.isFinite(input.amount)) throw new NotFiniteError("Amount must be finite")
    if (Number.isNaN(input.amount)) throw new NaNFieldError("Amount must be a number");
}