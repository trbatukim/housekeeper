import { AppError } from './base.error';

export class ValidationError extends AppError {
    public name = 'ValidationError'
    public readonly status = 400;
}

export class InputTooLongError extends ValidationError {
    public name = 'NameTooLongError';
}

export class EmptyFieldError extends ValidationError {
    public name = 'EmptyNameError';
}

export class NaNFieldError extends ValidationError {
    public name = "NaNAmountError";
}

export class NotFiniteError extends ValidationError {
    public name = "NotFiniteError";
}
