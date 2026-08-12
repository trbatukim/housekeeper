import { addLaundry } from "./actions"
import EndTimePicker from "./EndTimePicker"

export default async function LaundryPage() {
    return (
        <>
            <h1>Laundry</h1>

            <form action={addLaundry}>
                <EndTimePicker></EndTimePicker>
            </form>
        </>
    )
}