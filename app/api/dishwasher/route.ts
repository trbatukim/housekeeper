import { ActivityType } from "@/lib/pushward"
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
    return deleteContentFromTable(req, TableType.DISHWASHER)
}