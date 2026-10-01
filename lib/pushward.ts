export enum ActivityType {
    LAUNDRY = "Laundry",
    DISHWASHER = "Dishwasher",
}

export async function createLiveActivity(type: ActivityType, duration: number) {
    const slug = `${type.toLowerCase()}-timer`
    try {
        const res = await fetch(`https://api.pushward.app/activities/${slug}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${process.env.PUSHWARD_API_KEY}`,
                "Content-Type": "application/merge-patch+json",
            },
            body: JSON.stringify({
                state: "ongoing",
                content: {
                    template: "countdown",
                    state: "Running",
                    subtitle: type,
                    progress: 0,
                    duration: `${duration}`,
                    completion_message: type + " done!",
                    icon: "timer",
                    accent_color: "blue",
                    alarm: false,
                    warning_threshold: 300,
                },
            }),
        })

        if (!res.ok) {
            console.error("PushWard failed:", res.status, await res.text())
        }
    } catch (error) {
        console.error('Request failed:', error)
    }
}

export async function deleteLiveActivity(type: ActivityType) {
    const slug = `${type.toLowerCase()}-timer`
    try {
        const res = await fetch(`https://api.pushward.app/activities/${slug}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${process.env.PUSHWARD_API_KEY}`,
                "Content-Type": "application/merge-patch+json",
            },
            body: JSON.stringify({
                state: "ended",
                dismissal_ttl: 0,
            }),
        });

        if (!res.ok) {
            console.error("PushWard failed:", res.status, await res.text())
        }
    } catch (error) {
        console.error('Request failed:', error)
    }
}