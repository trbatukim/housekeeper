import {AppError} from "@/core/errors/base.error";

export class DuplicateError extends AppError {
    public name = "DuplicateError";
    public readonly status = 409;
}