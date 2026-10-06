import { ActivityType, deleteLiveActivity } from "@/lib/pushward"
import { cancelNtfyReq } from "@/lib/ntfy"
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
    return deleteContentFromTable(req, TableType.LAUNDRY, async (_db, householdId, rows) => {
        const notificationId = rows[0].ntfy_seq_id as string | null
        if (notificationId) {
            await cancelNtfyReq(notificationId, householdId)
        }

        await deleteLiveActivity(ActivityType.LAUNDRY, householdId)
    })
}