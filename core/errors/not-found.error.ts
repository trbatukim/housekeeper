import {AppError} from "@/core/errors/base.error";

export class NotFoundError extends AppError {
    public name = "NotFoundError";
    public readonly status = 404;
}