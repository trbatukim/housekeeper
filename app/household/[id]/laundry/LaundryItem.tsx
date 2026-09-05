'use client'

import Timer from '@/components/Timer'
import { formatEndsAt } from '@/components/Timer'

export default function LaundryItem({
    item,
}: {
    item: { id: string; ends_at: string; status: string }
}) {

    return (
        <>
            <span>
                Laundry ends at {formatEndsAt(item.ends_at)} (<Timer endsAt={item.ends_at} />)
            </span>
        </>
    )
}
