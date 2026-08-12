'use client'

function formatEndsAt(dateString: string) {
    dateString = new Date(dateString).toLocaleString()
    dateString = dateString.split(" ")[1]
    return dateString.split(":")[0] + ":" + dateString.split(":")[1]
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
