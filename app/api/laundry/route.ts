import { ActivityType } from "@/lib/pushward"
import {deleteContentFromTable, getAllContentFromTable, startLoad, TableType} from "@/lib/api"

export async function POST(req: Request) {
    return startLoad(req, {
        table: 'laundry_loads',
        activityType: ActivityType.LAUNDRY,
        doneMessage: "Laundry done!",
    })
}

export async function GET(req: Request): Promise<Response> {
    return getAllContentFromTable(req, TableType.LAUNDRY)
}

export async function DELETE(req: Request): Promise<Response> {
    return deleteContentFromTable(req, TableType.LAUNDRY)
}