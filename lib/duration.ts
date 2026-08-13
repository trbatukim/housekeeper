export function computeDurationSeconds(hours: number, minutes: number) {
    return hours * 3600 + minutes * 60
}

export function isValidDuration(seconds: number) {
    return Boolean(seconds) && seconds > 0
}
