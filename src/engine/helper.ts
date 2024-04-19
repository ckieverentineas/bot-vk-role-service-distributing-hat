import { chat_id, starting_date, vk } from "..";

export async function Worker_Checker() {
    await vk.api.messages.send({
        peer_id: chat_id,
        random_id: 0,
        message: `✅ Все ок! ${await Up_Time()}`,
    })
}

async function Up_Time() {
    const now = new Date();
    const diff = now.getTime() - starting_date.getTime();
    const timeUnits = [
        { unit: "дней", value: Math.floor(diff / 1000 / 60 / 60 / 24) },
        { unit: "часов", value: Math.floor((diff / 1000 / 60 / 60) % 24) },
        { unit: "минут", value: Math.floor((diff / 1000 / 60) % 60) },
        { unit: "секунд", value: Math.floor((diff / 1000) % 60) },
    ];
    return `Время работы: ${timeUnits.filter(({ value }) => value > 0).map(({ unit, value }) => `${value} ${unit}`).join(" ")}`
}

export async function Logger(text: String) {
    const project_name = `Distributing Hat`
    /*const options = {
        era: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        timeZone: 'UTC',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    };*/
    console.log(`[${project_name}] --> ${text} <-- (${new Date().toLocaleString("ru"/*, options*/)})`)
}