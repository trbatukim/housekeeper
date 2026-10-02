// HTTP headers only allow Latin-1, so fetch throws on Turkish chars or emojis.
// ntfy decodes RFC 2047 encoded-words, which keeps the title intact.
function encodeHeader(value: string) {
    return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`
}

export async function sendNtfyReq(textBody: string, endsAt: string, householdName: string, householdId: string) {
    const url = 'https://ntfy.sh/' + householdId
    const delayUnixSeconds = Math.floor(new Date(endsAt).getTime() / 1000)

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
                'title': encodeHeader(householdName),
                'X-Delay': String(delayUnixSeconds)
            },
            body: textBody
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json() as { id: string }
        return result.id
    } catch (error) {
        console.error('Request failed:', error)
    }
}

export async function cancelNtfyReq(notificationId: string, householdId: string) {
    const url = 'https://ntfy.sh/' + householdId + '/' + notificationId

    try {
        const response = await fetch(url, {
            method: 'DELETE'
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        console.log(response)
    } catch (error) {
        console.error('Request failed:', error)
    }
}

export async function sendNtfyReqWithoutDelay(textBody: string, householdName: string, householdId: string) {
    const url = 'https://ntfy.sh/' + householdId

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
                'title': encodeHeader(householdName)
            },
            body: textBody
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json() as { id: string }
        return result.id
    } catch (error) {
        console.error('Request failed:', error)
    }
}