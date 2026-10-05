import { ActivityType } from "@/lib/pushward"
import { startLoad } from "@/lib/api"

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
