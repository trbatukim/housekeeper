import {AppError} from "@/core/errors/base.error";

export class DatabaseError extends AppError {
    public name = "DatabaseError";
    public readonly status = 500;
}