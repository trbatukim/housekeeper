'use client'

import Timer from '@/components/Timer'
import { formatEndsAt } from '@/components/Timer'

export default function DishwasherItem({
    item,
}: {
    item: { id: string; ends_at: string; status: string }
    householdName: string
}) {

    return (
        <>
            <span>
                Dishwasher ends at {formatEndsAt(item.ends_at)} (<Timer endsAt={item.ends_at} />)
            </span>
        </>
    )
}
