export abstract class AppError extends Error {
    public abstract name: string;
    public abstract readonly status: number;

    constructor(message: string) {
        super(message);
    }
}
