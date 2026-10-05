import {addGrocery} from "@/lib/api";

export async function POST(req: Request) {
    return addGrocery(req)
}