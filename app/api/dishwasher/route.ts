import { ActivityType, deleteLiveActivity } from "@/lib/pushward"
import { cancelNtfyReq } from "@/lib/ntfy"
import {deleteContentFromTable, getAllContentFromTable, startLoad, TableType} from "@/lib/api"

export async function POST(req: Request) {
    return startLoad(req, {
        table: 'dishwasher_loads',
        activityType: ActivityType.DISHWASHER,
        doneMessage: "Dishwasher done!",
        onStarted: async (db, householdId) => {
            await db
                .from('dishes_status')
                .update({ status: 'cleaning' })
                .eq('household_id', householdId)
        },
    })
}

export async function GET(req: Request): Promise<Response> {
    return getAllContentFromTable(req, TableType.DISHWASHER)
}

export async function DELETE(req: Request): Promise<Response> {
    return deleteContentFromTable(req, TableType.DISHWASHER, async (db, householdId, rows) => {
        const notificationId = rows[0].ntfy_seq_id as string | null
        if (notificationId) {
            await cancelNtfyReq(notificationId, householdId)
        }

        const { data: remainingLoads } = await db
            .from('dishwasher_loads')
            .select('id')
            .eq('household_id', householdId)
            .eq('status', 'running')

        if (!remainingLoads || remainingLoads.length === 0) {
            await db
                .from('dishes_status')
                .update({ status: 'clean' })
                .eq('household_id', householdId)
        }

        await deleteLiveActivity(ActivityType.DISHWASHER, householdId)
    })
}