import { ActivityType } from "@/lib/pushward"
import { startLoad } from "@/lib/api"

export async function POST(req: Request) {
    return startLoad(req, {
        table: 'laundry_loads',
        activityType: ActivityType.LAUNDRY,
        doneMessage: "Laundry done!",
    })
}
