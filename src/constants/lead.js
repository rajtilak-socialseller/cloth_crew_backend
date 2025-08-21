const lead_status = {
    "OPEN": "OPEN",
    "UNDER_CONNECTION": "UNDER_CONNECTION",
    "FOLLOWUP": "FOLLOWUP",
    "PROSPECTS": "PROSPECTS",
    "ON_HOLD": "ON_HOLD",
    "CANCELLED": "CANCELLED",
    "COMPLETED": "COMPLETED",
    "COMFIRMED": "COMFIRMED"
}
// },
const lead_source = {
    "WHATSAPP": "WHATSAPP",
    "INSTAGRAM": "INSTAGRAM",
    "YOUTUBE_CHANNEL": "YOUTUBE_CHANNEL",
    "APP": "APP",
    "WEBSITE": "WEBSITE"
}
const lead_type = {
    "HOT_LEAD": "HOT_LEAD",
    "WARM_LEAD": "WARM_LEAD",
    "COLD_LEAD": "COLD_LEAD",
    "NOT_CONNECTED": "NOT_CONNECTED"
}


module.exports = {
    lead_status, lead_source, lead_type
}
