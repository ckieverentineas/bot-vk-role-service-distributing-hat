import { VK, Keyboard, IMessageContextSendOptions, ContextDefaultState, MessageContext } from 'vk-io';
import { HearManager } from '@vk-io/hear';
import { Headman, PrismaClient } from '@prisma/client';
import {
    QuestionManager,
    QuestionMessageContext
} from 'vk-io-question';
import { randomInt } from 'crypto';
import { timeStamp } from 'console';
import { registerUserRoutes } from './engine/player';
import { InitGameRoutes } from './engine/init';
import { send } from 'process';
import * as dotenv from 'dotenv';
import { env } from 'process';
import got from 'got';
import prisma from './engine/prisma_client';
import { Logger, Worker_Checker } from './engine/helper';
import { askQuestion } from './engine/question';
import { getConfig, getResetCode } from './engine/config';
import { Start_Worker_API_Bot } from './api';
import { questionBank, finalQuestion, getRandomQuestions } from './questions_bank';

dotenv.config();

// Авторизация
export const token: string = String(process.env.token);
export const root: number = Number(process.env.root);
export const chat_id: number = Number(process.env.chat_id);
export let group_id: number = Number(process.env.group_id);

export const timer_text = { answerTimeLimit: 300_000 };
export const answerTimeLimit = 300_000;
export const starting_date = new Date();

// Картинки для факультетов
const facultyPhotos = {
    grif: 'photo-224622524_457245144',
    sliz: 'photo-224622524_457245145',
    coga: 'photo-224622524_457245147',
    puff: 'photo-224622524_457245146'
};

// Варианты начала поста
const postBeginnings = [
    "🎩 Слышим фанфары — в Хогвартс Онлайн прибыл новый студент!",
    "🧙‍♂️ Распределяющая Шляпа заговорила…",
    "🪄 Магический пергамент дрогнул — ещё один новичок появился!",
    "🦉 Новости из Зала Распределения!",
    "✨ Мир волшебства пополнился ещё одним учеником!",
    "🏰 Хогвартс Онлайн стал чуточку больше!",
    "🎓 Шляпа покрутилась, прищурилась и вынесла свой вердикт…",
    "⚡ В Зале Распределения сегодня жарко — новый студент прибыл!",
    "🌙 Под светом луны Шляпа сделала свой выбор...",
    "🔮 Хрустальный шар показал нам нового ученика Хогвартса Онлайн!",
    "📯 Трубы протрубили о новом обитателе замка!",
    "🌌 Звёзды предрекли судьбу очередного волшебника!",
    "🚨 Код КРАСНЫЙ! В замке замечен неопознанный магический объект!",
    "🕰️ Время распределения пробило для нового студента!",
    "📜 Древний свиток запечатлел новое имя в анналах Хогвартса Онлайн!",
    "🔥 Феникс пропел в честь нового ученика!",
    "🌪️ Вихрь магии принёс нам нового студента!",
    "🏆 Турнир факультетов пополнился новым участником!",
    "🧭 Компас судьбы указал на нового обитателя Хогвартса Онлайн!",
    "💎 Кристаллы предсказали появление нового волшебника!",
    "🧙‍♂️ Шляпа, стирая магический пот со лба:",
    "🌠 Падающая звезда осветила путь новому ученику!",
    "📜 Согласно древнему свитку (который мы только что сочинили)...",
    "⚠️ ВНИМАНИЕ! Шляпа только что уронила очередного студента в...",
    "💥 БАМ! И вот уже новый труп... тьфу, студент в Хогвартсе!",
    "🌚 Когда все спали, Шляпа тихо пробормотала: 'Ещё один...'",
    "📢 ЭКСТРЕННО! В замке завелся очередной носитель магии!",
    "🍵 Шляпа отложила чай, чтобы заселить нового ученика в...",
    "💣 Прибыл новобранец!",
    "🌀 Магический вихрь принёс нам жертву... тьфу, ученика!",
    "📛 ТРЕВОГА! Обнаружена новая цель для домашних заданий!",
    "🍞 Поджаренный тост для новобранца упал факультетом вниз...",
    "📢 СРОЧНОЕ ОБЪЯВЛЕНИЕ! В замке пополнение!",
    "⚗️ Зельеварение станет веселее — у нас новый подопытный!",
    "🗺️ На карте Хогвартса появилась новая метка!",
    "📮 Сова доставила свежую партию студентов!",
    "⚓ Бросить якорь! Новый моряк в море магии!",
    "📡 Магический радар засек новую цель!",
    "🎯 Попадание в яблочко! Шляпа не промахнулась!",
    "🎁 Хогвартс получил подарок — нового студента!",
    "📢 Система оповещения Хогвартса сообщает: ПОПОЛНЕНИЕ!",
    "⚔️ Турнир трёх волшебников? Нет, турнир четырёх факультетов!",
    "📢 Громогласно объявляем: ЕЩЁ ОДИН!",
    "🚀 На скоростной метле ворвался новичок в Хогвартс Онлайн!",
    "🪶 Перо самоначертателя вывело очередное имя...",
    "🌩️ Гром грянул — Шляпа определила судьбу!",
    "🕵️‍♂️ Детектив магии раскрыл дело о новом студенте!",
    "📡 Приём! Приём! К нам поступил новый сигнал!",
    "🧿 Магический амулет притянул нового волшебника!",
    "🪙 Монетка судьбы подброшена — факультет определён!",
    "🔔 Колокол прозвенел — встречайте нового ученика!",
    "🧳 Чемодан волшебника распакован — встречайте!",
    "🎇 Фейерверк в честь нового ученика взлетел!",
    "🎣 Улов удался — поймали нового волшебника!",
    "🔮 Дресс-код: мантия — новый студент прибыл!",
    "🚪 Потайная дверь открылась — вышел студент!",
    "🪁 Ветер перемен принёс нового ученика!",
    "🪙 Кубок огня... ой, то есть Шляпа, сделала выбор!",
    "🪞 Зеркало Еиналеж отразило нового обитателя замка!",
    "🧫 В магической чашке Петри вырос новый микроб... студент!",
    "🪤 Мышеловка для маглов сработала — попался волшебник!",
    "🪃 Бумеранг удачи вернулся с новым студентом!",
    "🛒 Тележка на платформе 9 ¾ прикатила нового пассажира!",
    "🧹 Метла приняла самостоятельное решение и доставила новичка!",
    "☕ Шляпа пролила кофе на абитуриента — вот и распределение!"
];

// Варианты основной части по факультетам
const facultyMessages = {
    grif: (name: string) =>
        `Гриффиндор! Смелость, отвага и честь — всё говорит о том, что игрок ${name} теперь в Гриффиндоре! 🦁\n\n🔥 Где храбрость, там и победа! Добро пожаловать в логово львов, где каждый день — это новое приключение!`,
    puff: (name: string) =>
        `Пуффендуй! Доброта, трудолюбие и верность — Шляпа уверена: игрок ${name} — настоящий Пуффендуец! 🦡\n\n🍯 Здесь ценят упорство и честность больше всего на свете! Добро пожаловать в улей трудолюбивых!`,
    coga: (name: string) =>
        `Когтевран! Мудрость и стремление к знаниям привели игрока ${name} в Когтевран! 🦅\n\n📚 Где ум ведёт, там и рука следует! Тебе открыты все тайны библиотеки и мудрость веков!`,
    sliz: (name: string) =>
        `Слизерин! Амбиции и находчивость — именно эти качества направили игрока ${name} в Слизерин! 🐍\n\n💚 Самые хитрые и целеустремленные находят здесь свой дом. Добро пожаловать в подземелья амбиций!`
};

// Варианты концовки
const postEndings = [
    "✉️ Хочешь узнать, куда попадёшь ты? Пиши в сообщения сообщества!\n👉 [https://vk.com/ho_hat|Пройти распределение]"
];

// Создание поста на стене сообщества
async function createFacultyPost(context: any, name: string, faculty: string) {
    const beginning = postBeginnings[Math.floor(Math.random() * postBeginnings.length)];
    const facultyPart = facultyMessages[faculty as keyof typeof facultyMessages](name);
    const ending = postEndings[Math.floor(Math.random() * postEndings.length)];

    const postText = `${beginning}\n\n${facultyPart}\n\n${ending}`;

    await vk.api.wall.post({
        owner_id: -group_id,
        from_group: 1,
        message: postText,
        attachments: facultyPhotos[faculty as keyof typeof facultyPhotos]
    });
}

// Инициализация
const questionManager = new QuestionManager();
const hearManager = new HearManager<MessageContext & QuestionMessageContext>();

export let vk: VK;

async function resolveGroupId(): Promise<number> {
    const probeVk = new VK({
        token,
        apiMode: 'sequential',
        apiLimit: 1
    });

    const currentGroup = await probeVk.api.groups.getById({});
    const detectedGroupId = currentGroup.groups[0]?.id;

    if (!detectedGroupId) {
        throw new Error('Не удалось определить id сообщества по токену');
    }

    if (
        Number.isFinite(group_id) &&
        group_id > 0 &&
        group_id !== detectedGroupId
    ) {
        console.warn(
            `⚠️ group_id из .env (${group_id}) отличается от id токена (${detectedGroupId}); использую id токена.`
        );
    }

    return detectedGroupId;
}

async function bootstrap() {
    group_id = await resolveGroupId();

    vk = new VK({
        token,
        pollingGroupId: group_id,
        apiMode: 'sequential',
        apiLimit: 1
    });

    vk.updates.use(questionManager.middleware);
    vk.updates.on('message_new', hearManager.middleware);

    InitGameRoutes(hearManager);
    registerUserRoutes(hearManager);
    registerMainRoutes();

    await vk.updates.start();
    await Logger('✅ Бот успешно запущен!');
    await Start_Worker_API_Bot();

    setInterval(Worker_Checker, 86400000);
}

bootstrap().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

async function getGroupAdmins(): Promise<number[]> {
    try {
        const admins = await vk.api.groups.getMembers({
            group_id: String(group_id),
            filter: 'managers'
        });

        return admins.items.map((admin: any) => admin.id);
    } catch (error) {
        console.error('Ошибка при получении списка администраторов:', error);
        return [root];
    }
}

async function isGroupAdmin(userId: number): Promise<boolean> {
    try {
        const admins = await getGroupAdmins();
        return admins.includes(userId) || userId === root;
    } catch (error) {
        console.error('Ошибка при проверке администратора:', error);
        return userId === root;
    }
}

// Сообщения для просьбы о смене факультета
const facultyChangeWarnings = [
    "👟 Швыряет тапком\n\n⚖️ Правила Хогвартса Онлайн ясны и неизменны: распределение проходит лишь однажды! Смена факультета возможна исключительно после завершения первого курса.\n\n🚫 Если продолжишь свои манипуляции, то патруль мракоборцев доставит тебя прямиком в Азкабан.",
    "🪄 Магически материализует учебник правил\n\n📜 Статья N, параграф Y Устава Хогвартса Онлайн гласит: каждый ученик проходит распределение единожды. Попытка несанкционированной смены факультета карается по закону.\n\n👮‍♂️ Мракоборцы уже получили совиную почту о твоих намерениях. Следующая остановка — Азкабан.",
    "🧙‍♂️ Достаёт волшебную палочку и грустно качает головой\n\n🎭 Дорогой ученик, Шляпа распределила тебя не просто так! Если будешь пытаться обойти её мудрое решение, тебя ждёт:\n1) неделя отработок с Филчем\n2) чистка ночных горшков без магии;\n3) лекции о безопасности от Локонса... дважды в день!",
    "⚡ Вспышка молнии освещает зал\n\n🏛️ Решение Распределяющей Шляпы — закон для всех четырёх факультетов! Смена возможна только после завершения первого курса.\n\n🚔 Мракоборческий патруль 'Ночные Сыщики' уже в пути.",
    "🐉 Издаёт рычание, похожее на драконье\n\n🗿 Ты что, думаешь, мы просто так церемонию распределения каждый год проводим? Это сакральный ритуал!\n\n⛓️ Ещё одно слово о смене факультета — и тебя отправят:\n• на кухню к домашним эльфам на перемывание всех котлов;\n• в оранжерею №3 к мандрагорам без берушей;\n• на отработку в Запретный лес... ночью!"
];

// Сообщения для возвращения в школу
const returnToSchoolMessages = [
    "🏰 Замок скрипит древними балками\n\n🔙 Если жаждешь вернуться в стены Хогвартса Онлайн, направь сову (напиши в сообщение) в самое сердце нашей администрации:\n\n📬 Сообщество Хогвартса Онлайн: https://vk.com/hogonline\n\n⚖️ Только верховный совет может вынести вердикт о твоём возвращении.",
    "🦉 Сова доставляет свиток\n\n📜 Прошение о повторном зачислении принимается исключительно:\n• в полнолуние;\n• на пергаменте, добытом у тролля;\n• чернилами, смешанными с пылью лунного света.\n\n🏛️ Но для начала просто напиши в сообщения сообщества: https://vk.com/hogonline.",
    "🧳 Старый чемодан раскрывается с треском\n\n🎓 Возвращение в Хогвартс — дело нешуточное!\n\n✍️ Начни с обращения в сообщество: https://vk.com/hogonline.",
    "🗝️ Звякают ключи Филча\n\n🚪 Двери Хогвартса Онлайн открываются для возвращающихся лишь по особому распоряжению.\n\n📩 Пиши сюда: https://vk.com/hogonline."
];

function registerMainRoutes() {
    vk.updates.on('message_new', async (context: any, next: any) => {
        // Игнорируем сообщения из лог-чата
        if (context.peerId === chat_id) {
            return await next();
        }

        // Пропускаем настоящие беседы
        if (
            context.peerType === 'chat' &&
            context.peerId !== context.senderId
        ) {
            return await next();
        }

        /*
         * Проверка возраста аккаунта VK.
         * Если VK недоступен, дата не найдена или ответ некорректный,
         * пропускаем проверку и продолжаем регистрацию.
         */
        try {
            const response = await got.get(
                `https://vk.com/foaf.php?id=${context.senderId}`,
                {
                    timeout: {
                        request: 5000
                    },
                    retry: {
                        limit: 0
                    }
                }
            );

            const data = response.body;
            const arr = data.split('<');

            for (const item of arr) {
                if (!item.includes('ya:created dc:date=')) {
                    continue;
                }

                const match = item.match(/"([^"]+)"/);

                if (!match) {
                    break;
                }

                const registrationDate = new Date(match[1]);

                if (Number.isNaN(registrationDate.getTime())) {
                    break;
                }

                const accountAge = Date.now() - registrationDate.getTime();
                const thirtyDays = 30 * 24 * 60 * 60 * 1000;

                if (accountAge >= 0 && accountAge < thirtyDays) {
                    await context.send(
                        '⁉ Вашей странице меньше месяца. Вы не можете пройти распределение сейчас. Приходите через 30 дней от даты регистрации своего аккаунта!'
                    );
                    return;
                }

                break;
            }
        } catch (error: unknown) {
            // Не обращаемся к error.response.statusCode:
            // у сетевых ошибок response может отсутствовать.
            console.warn(
                '[Registration] Не удалось проверить дату создания VK-аккаунта. Проверка пропущена.',
                error instanceof Error ? error.message : error
            );
        }

        const user_check = await prisma.user.findFirst({
            where: {
                idvk: context.senderId
            }
        });

        // Если пользователь уже прошёл распределение
        if (user_check) {
            const currentResetCode = await getResetCode();

            if (context.text?.trim() === currentResetCode) {
                const delatt = await prisma.user.delete({
                    where: {
                        id: user_check.id
                    }
                });

                if (delatt) {
                    await context.send(
                        `🎓 Волшебный код активирован! Ваш профиль ученика ${user_check.name} стирается из книг регистрации.\n\n✨ Чтобы пройти распределение, напишите "Начать"!`
                    );
                    await Logger(`Deleted ${user_check.name}`);
                }

                return;
            }

            // Игнорируем команды, начинающиеся с !
            if (!context.text?.startsWith('!') && context.text) {
                const answer = await askQuestion(
                    context,
                    `🎩 Шляпа приподнимается и смотрит на вас, прищурившись:\n"Кажется, я вас не совсем поняла. Уточните, что требуется?"`,
                    {
                        keyboard: Keyboard.builder()
                            .textButton({
                                label: '🏰 Хочу другой факультет',
                                payload: { command: 'change_faculty' },
                                color: 'secondary'
                            })
                            .row()
                            .textButton({
                                label: '📚 Хочу вернуться в школу',
                                payload: { command: 'return_to_school' },
                                color: 'secondary'
                            })
                            .row()
                            .textButton({
                                label: '🔐 Ввести код сброса',
                                payload: { command: 'enter_reset_code' },
                                color: 'primary'
                            })
                            .row()
                            .textButton({
                                label: '❌ Отмена',
                                payload: { command: 'cancel' },
                                color: 'negative'
                            })
                            .oneTime()
                            .inline(),
                        answerTimeLimit: 30000
                    }
                );

                if (!answer) return;

                const answerPayload = answer.messagePayload as
                    | { command?: string }
                    | undefined;

                if (answerPayload?.command === 'change_faculty') {
                    const randomWarning =
                        facultyChangeWarnings[
                            Math.floor(Math.random() * facultyChangeWarnings.length)
                        ];

                    await context.send(randomWarning);
                    return;
                }

                if (answerPayload?.command === 'return_to_school') {
                    const randomMessage =
                        returnToSchoolMessages[
                            Math.floor(Math.random() * returnToSchoolMessages.length)
                        ];

                    await context.send(randomMessage);
                    return;
                }

                if (answerPayload?.command === 'enter_reset_code') {
                    const codeAnswer = await askQuestion(
                        context,
                        '🔐 Введите магический код сброса:',
                        {
                            keyboard: Keyboard.builder()
                                .textButton({
                                    label: '❌ Отмена',
                                    payload: { command: 'cancel_reset' },
                                    color: 'negative'
                                })
                                .oneTime()
                                .inline(),
                            answerTimeLimit: 60000
                        }
                    );

                    if (!codeAnswer) return;

                    const codeAnswerPayload = codeAnswer.messagePayload as
                        | { command?: string }
                        | undefined;

                    if (codeAnswerPayload?.command === 'cancel_reset') {
                        await context.send('❌ Операция сброса отменена.');
                        return;
                    }

                    if (codeAnswer.text?.trim() === currentResetCode) {
                        const delatt = await prisma.user.delete({
                            where: {
                                id: user_check.id
                            }
                        });

                        if (delatt) {
                            await context.send(
                                `🎓 Волшебный код активирован! Ваш профиль ученика (${user_check.name}) стирается из книг регистрации.\n\n✨ Чтобы пройти распределение, напишите "Начать"!`
                            );
                            await Logger(`Deleted ${user_check.name}`);
                        }
                    } else {
                        await context.send('❌ Неверный магический код!');
                    }

                    return;
                }

                if (answerPayload?.command === 'cancel') {
                    await context.send(
                        '✨ Шляпа кивает: "Хорошо, если понадобится помощь — обращайтесь!"'
                    );
                    return;
                }

                return;
            }

            return;
        }

        // Если пользователь ещё не прошёл распределение
        if (!user_check) {
            const answer = await askQuestion(
                context,
                '🧷 Внимание, вопрос на миллион галлеонов: ты действительно жаждешь прикоснуться к прекрасному, то бишь пройти распределение и вступить в ряды студентов текстовой ролевой игры [https://vk.com/hogonline|Хогвартс Онлайн]? Понимаешь ли ты, что после того как древняя и местами вонючая Шляпа определит твою судьбу, на горизонте материализуется староста твоего факультета — существо, наделённое полномочиями докапываться до тебя с вопросами «ты где пропадал(а), на зельеварение забил(а), почему в банке до сих пор не зарегистрирован(а) и где вообще твоя мантия парадная»? Осознаёшь ли ты, что декана придётся не просто знать в лицо, а добавить в друзья, потому что так надо, так записано в древних свитках, и спорить с этим бесполезно? Готов(а) ли ты к тому, что твоя жизнь разделится на «до» и «после», появятся долги по учёбе, необходимость общаться с сокурсниками и прочие прелести социальной жизни, от которых некоторые специально в Хогвартс и поступают, чтобы сбежать от маггловской реальности? Если ты всё это осмыслил(а), принял(а), переварил(а) и всё ещё горишь желанием — нажимай зелёную кнопку, и да пребудет с тобой магия. Если же ты просто хотел(а) потыкать кнопки, узнать свой факультет и свалить в закат — нажми красную и живи спокойно, не множа ряды тех, кто пропадает через неделю.',
                {
                    keyboard: Keyboard.builder()
                        .textButton({
                            label: 'Да, я в деле, зачисляйте!',
                            payload: { command: 'Согласиться' },
                            color: 'positive'
                        })
                        .row()
                        .textButton({
                            label: 'Нет, я мимо проходил(а)',
                            payload: { command: 'Отказаться' },
                            color: 'negative'
                        })
                        .oneTime(),
                    answerTimeLimit
                }
            );

            if (!answer) {
                await context.send(
                    '⏰ Время ожидания на подтверждение согласия истекло!'
                );
                return;
            }

            if (!/да|yes|Согласиться|конечно/i.test(answer.text || '{}')) {
                await context.send(
                    '🎩 Шляпа кивает: "Хорошо, подумайте ещё. Я всегда здесь, когда будете готовы."'
                );
                return;
            }

            const counter_players = await prisma.user.count();

            await context.send(
                `🏰 Добро пожаловать в Хогвартс Онлайн! \n\n🌟 Здесь обучаются юные волшебники и волшебницы. \n🧙‍♀️ Персонал Хогвартса — это лучшие педагоги и специалисты в своих областях. \n🎉 И вот, все собрались в Большом зале, а профессор МакГонагалл надела на вас распределяющую шляпу...`
            );

            let name_check = false;
            const datas: any[] = [];

            while (name_check === false) {
                const name = await askQuestion(
                    context,
                    `🧷 Введите имя и фамилию персонажа (канонных персов брать нельзя, по типу Гарри Поттер и т.д.): \n❗Максимум 30 символов`,
                    timer_text
                );

                if (!name) {
                    await context.send(
                        '⏰ Время ожидания на ввод имени истекло!'
                    );
                    return;
                }

                const characterName = name.text?.trim() ?? '';

                if (characterName.length <= 30) {
                    const blacklist = [
                        'Амбридж', 'Аббот', 'Абернэти', 'Бабблинг', 'Бербидж',
                        'Белби', 'Беллчант', 'Боунс', 'Бидль', 'Бинс', 'Биннс',
                        'Блэк', 'Блек', 'Блетчли', 'Берк', 'Бёрк', 'Боунс',
                        'Бруствер', 'Булстроуд', 'Бут', 'Бэгмен', 'Бэрбоун',
                        'Бьюкенен', 'Вейн', 'Вектор', 'Вуд', 'Гаджен', 'Гамп',
                        'Гойл', 'Голдштейн', 'Голдстейн', 'Гринграсс',
                        'Грин-де-Вальд', 'Гриндевальд', 'Грейнджер',
                        'Грэйнджер', 'Грегорович', 'Гриффиндор', 'Грюм',
                        'Гуссокл', 'Дамблдор', 'Делакур', 'Диггори', 'Диппет',
                        'Джонсон', 'Дженкинс', 'Джонс', 'Джордан',
                        'Долгопупс', 'Долохов', 'Дурсль', 'Дэвис', 'Забини',
                        'Каркаров', 'Квиррелл', 'Когтевран', 'Ковальски',
                        'Коллинс', 'Крам', 'Крауч', 'Криви', 'Кристал',
                        'Кроули', 'Кроткотт', 'Крэбб', 'Керроу',
                        'Кэмпбелл', 'Кэрроу', 'Лавгуд', 'Лавгут', 'Лакруа',
                        'Лестрейндж', 'Локонс', 'Локхарт', 'Лонгботтом',
                        'Лонгботом', 'Люпин', 'Макгонагалл', 'МакГонагалл',
                        'МакКиннон', 'Маккормак', 'Маклагген', 'Макмиллан',
                        'Мальсибер', 'Малфой', 'Миртл', 'Монтегю', 'Мракс',
                        'Нотт', 'Оллертон', 'Олливандер', 'Паддифут',
                        'Паркинсон', 'Патил', 'Певерелл', 'Пейдж', 'Петтигрю',
                        'Пинс', 'Помфри', 'Поттер', 'Пруэтт', 'Пуффендуй',
                        'Реддл', 'Реддль', 'Риддл', 'Розмерта', 'Розье',
                        'Роули', 'Руквуд', 'Саламандер', 'Селвин', 'Сивый',
                        'Синистра', 'Скиттер', 'Скримджер', 'Стебль',
                        'Слизнорт', 'Слизерин', 'Снейп', 'Снегг', 'Снэйп',
                        'Сэллоу', 'Тонкс', 'Трелони', 'Трэлони', 'Трэверс',
                        'Уизли', 'Фадж', 'Филч', 'Финниган', 'Финиган',
                        'Финч-Флэтчли', 'Флинт', 'Флитвик', 'Фортескью',
                        'Фоули', 'Харрис', 'Хагрид', 'Чанг', 'Шафик',
                        'Шевалье', 'Эванс', 'Эйвери', 'Яксли'
                    ];

                    let warner = false;

                    if (characterName.replace(/[^а-яА-Я -]/gi, '') !== characterName) {
                        await context.send(
                            '💡 Внимание! Пишите только русскими символами (пробелы и дефисы разрешены)'
                        );
                        warner = true;
                    }

                    if (warner === false) {
                        const nameParts = characterName.split(/[\s-]+/);

                        for (const part of nameParts) {
                            const forbidden = blacklist.find(
                                item => part.toLowerCase() === item.toLowerCase()
                            );

                            if (forbidden) {
                                warner = true;
                                await context.send(
                                    `⚡ Внимание! Имя "${forbidden}" является запрещенным!`
                                );
                                break;
                            }
                        }
                    }

                    if (warner === false) {
                        name_check = true;
                        datas.push({ name: characterName });
                    } else {
                        await context.send(
                            '✍️ Введите имя персонажа должным образом!'
                        );
                    }
                } else {
                    await context.send(
                        '📏 Имя должно содержать не более 30 символов!'
                    );
                }
            }

            // Генерация случайных вопросов из банка
            const randomQuestions = getRandomQuestions(7);
            const allQuestions = [...randomQuestions, finalQuestion];

            let result = '';

            for (let qIndex = 0; qIndex < allQuestions.length; qIndex++) {
                const question = allQuestions[qIndex];
                let answer_check = false;

                while (answer_check === false) {
                    const keyboard = Keyboard.builder();
                    const options = question.options;

                    if (options.length === 4) {
                        options.forEach(option => {
                            keyboard.textButton({
                                label: option.emoji,
                                payload: { command: option.faculty },
                                color: 'secondary'
                            });
                        });
                        keyboard.row();
                    } else if (options.length === 5) {
                        for (let i = 0; i < 3; i++) {
                            keyboard.textButton({
                                label: options[i].emoji,
                                payload: { command: options[i].faculty },
                                color: 'secondary'
                            });
                        }
                        keyboard.row();

                        for (let i = 3; i < 5; i++) {
                            keyboard.textButton({
                                label: options[i].emoji,
                                payload: { command: options[i].faculty },
                                color: 'secondary'
                            });
                        }
                        keyboard.row();
                    } else if (options.length === 6) {
                        for (let i = 0; i < 3; i++) {
                            keyboard.textButton({
                                label: options[i].emoji,
                                payload: { command: options[i].faculty },
                                color: 'secondary'
                            });
                        }
                        keyboard.row();

                        for (let i = 3; i < 6; i++) {
                            keyboard.textButton({
                                label: options[i].emoji,
                                payload: { command: options[i].faculty },
                                color: 'secondary'
                            });
                        }
                        keyboard.row();
                    } else if (options.length === 7) {
                        for (let i = 0; i < 4; i++) {
                            keyboard.textButton({
                                label: options[i].emoji,
                                payload: { command: options[i].faculty },
                                color: 'secondary'
                            });
                        }
                        keyboard.row();

                        for (let i = 4; i < 7; i++) {
                            keyboard.textButton({
                                label: options[i].emoji,
                                payload: { command: options[i].faculty },
                                color: 'secondary'
                            });
                        }
                        keyboard.row();
                    } else if (options.length === 8) {
                        for (let i = 0; i < 4; i++) {
                            keyboard.textButton({
                                label: options[i].emoji,
                                payload: { command: options[i].faculty },
                                color: 'secondary'
                            });
                        }
                        keyboard.row();

                        for (let i = 4; i < 8; i++) {
                            keyboard.textButton({
                                label: options[i].emoji,
                                payload: { command: options[i].faculty },
                                color: 'secondary'
                            });
                        }
                        keyboard.row();
                    }

                    keyboard.oneTime().inline();

                    let optionsText = '\n\n';
                    question.options.forEach((opt, idx) => {
                        optionsText += `${opt.emoji} — ${opt.text}\n`;
                    });

                    const answer = await askQuestion(
                        context,
                        `🧷 Вопрос ${qIndex + 1} из ${allQuestions.length}:\n\n${question.text}${optionsText}\n👇 Выберите вариант, нажав на соответствующую кнопку:`,
                        {
                            keyboard,
                            answerTimeLimit
                        }
                    );

                    if (!answer) {
                        await context.send('⏰ Время ожидания на ответ истекло!');
                        return;
                    }

                    const answerPayload = answer.messagePayload as
                        | { command?: string }
                        | undefined;

                    if (!answerPayload?.command) {
                        await context.send(
                            '💡 Нажмите на одну из кнопок с иконками!'
                        );
                    } else {
                        result += `${answerPayload.command} `;
                        answer_check = true;
                    }
                }
            }

            const ans = result.split(' ');
            const priority = await getConfig();
            const target1 = priority.target1;
            const target2 = priority.target2;
            const target3 = priority.target3;
            const target4 = priority.target4;

            const complet: any = {
                [target4]: 0,
                [target3]: 0,
                [target2]: 0,
                [target1]: 0
            };

            for (let i = 0; i < ans.length; i++) {
                if (ans[i] && Object.prototype.hasOwnProperty.call(complet, ans[i])) {
                    complet[ans[i]] = complet[ans[i]] + 1;
                }
            }

            const win = Object.entries(complet).reduce(
                (acc: any, curr: any) => acc[1] > curr[1] ? acc : curr
            )[0];

            const get_headman: Headman | null = await prisma.headman.findFirst();

            const data_answer: any = {
                coga: `💙💙🎉🎊 КОГТЕВРАН! \n\nШляпа задумчиво поёрзала на вашей голове:\n"Хм... острый ум, жажда знаний, любопытство! Определённо — КОГТЕВРАН!"\n\n🎓 Поздравляем, ученик(ца) ${datas[0].name}!\n\n🔑 Ваши следующие шаги:\n1️⃣ Подайте заявку в [https://vk.com/club203252392|гостиную Когтеврана]\n2️⃣ Пароль для входа: ЗНАНИЕ — СИЛА (отправить в сообщения сообществу)\n3️⃣ Совершите покупки в [https://vk.com/ho_bank|банке Гринготтс]\n4️⃣ Добавьте в друзья декана: https://vk.com/id638027723\n5️⃣ Ваш староста: ${get_headman?.coga}\n\n⚖️ Помните: смена факультета возможна только на 2 курсе!`,

                puff: `💛💛🎉🎊 ПУФФЕНДУЙ! \n\nШляпа радостно пропела:\n"Верность, трудолюбие, честность! Без сомнений — ПУФФЕНДУЙ!"\n\n🎓 Поздравляем, ученик(ца) ${datas[0].name}!\n\n🔑 Ваши следующие шаги:\n1️⃣ Подайте заявку в [https://vk.com/club200655488|гостиную Пуффендуя]\n2️⃣ Пароль для входа: ДОБРОЕ СЕРДЦЕ (отправить в сообщения сообществу)\n3️⃣ Совершите покупки в [https://vk.com/ho_bank|банке Гринготтс]\n4️⃣ Добавьте в друзья декана: https://vk.com/id470933343\n5️⃣ Ваш староста: ${get_headman?.puff}\n\n⚖️ Помните: смена факультета возможна только на 2 курсе!`,

                sliz: `💚💚🎉🎊 СЛИЗЕРИН! \n\nШляпа прошипела таинственно:\n"Амбиции, хитрость, целеустремлённость! Совершенно ясно — СЛИЗЕРИН!"\n\n🎓 Поздравляем, ученик(ца) ${datas[0].name}!\n\n🔑 Ваши следующие шаги:\n1️⃣ Подайте заявку в [https://vk.com/slytherin_hogonline|гостиную Слизерина]\n2️⃣ Пароль для входа: ЧИСТАЯ КРОВЬ (отправить в сообщения сообществу)\n3️⃣ Совершите покупки в [https://vk.com/ho_bank|банке Гринготтс]\n4️⃣ Добавьте в друзья декана: https://vk.com/psnape\n5️⃣ Ваш староста: ${get_headman?.sliz}\n\n⚖️ Помните: смена факультета возможна только на 2 курсе!`,

                grif: `❤❤🎉🎊 ГРИФФИНДОР! \n\nШляпа громко прокричала:\n"Отвага, благородство, смелость! Несомненно — ГРИФФИНДОР!"\n\n🎓 Поздравляем, ученик(ца) ${datas[0].name}!\n\n🔑 Ваши следующие шаги:\n1️⃣ Подайте заявку в [https://vk.com/griffindor_hogonline|гостиную Гриффиндора]\n2️⃣ Пароль для входа: КАПУТ ДРАКОНИС (отправить в сообщения сообществу)\n3️⃣ Совершите покупки в [https://vk.com/ho_bank|банке Гринготтс]\n4️⃣ Добавьте в друзья декана: https://vk.com/id865081770\n5️⃣ Ваш староста: ${get_headman?.grif}\n\n⚖️ Помните: смена факультета возможна только на 2 курсе!`
            };

            await context.send(`${data_answer[win]}`);

            const save = await prisma.user.create({
                data: {
                    idvk: context.senderId,
                    name: datas[0].name,
                    sliz: complet.sliz || 0,
                    coga: complet.coga || 0,
                    puff: complet.puff || 0,
                    grif: complet.grif || 0,
                    facult: win
                }
            });

            await Logger(`Success save user idvk: ${context.senderId}`);

            await vk.api.messages.send({
                peer_id: chat_id,
                random_id: 0,
                message: `⚰ Поздравляем @id${context.senderId}(${datas[0].name}) \n 🏆 ${win}: 🦡${complet.puff || 0} 🦁${complet.grif || 0} 🐍${complet.sliz || 0} 🦅${complet.coga || 0}!`
            });

            await createFacultyPost(context, datas[0].name, win);

            return;
        }

        return await next();
    });
}
