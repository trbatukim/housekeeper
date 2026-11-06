import { AppError } from './base.error';

export class ValidationError extends AppError {
    public name = 'ValidationError'
    public readonly status = 400;
}