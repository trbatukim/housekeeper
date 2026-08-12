'use client'

function formatEndsAt(dateString: string) {
    const time = new Date(dateString).toLocaleString().split(' ')[1]
    const [hours, minutes] = time.split(':')
    return `${hours}:${minutes}`
}

export default function LaundryItem({
    item,
}: {
    item: { id: string; ends_at: string; status: string }
    householdName: string
}) {

    return (
        <>
            <span>
                Laundry ends at {formatEndsAt(item.ends_at)}
            </span>
        </>
    )
}
