import { VK, Keyboard, IMessageContextSendOptions, ContextDefaultState, MessageContext } from 'vk-io'; 
import { HearManager } from '@vk-io/hear';
import { Config, Headman, PrismaClient } from '@prisma/client'
import {
    QuestionManager,
    IQuestionMessageContext
} from 'vk-io-question';
import { randomInt } from 'crypto';
import { timeStamp } from 'console';
import { registerUserRoutes } from './engine/player'
import { InitGameRoutes } from './engine/init';
import { send } from 'process';
import * as dotenv from 'dotenv'
import { env } from 'process';
import got from 'got';
import prisma from './engine/prisma_client';
import { Logger, Worker_Checker } from './engine/helper';
import { Start_Worker_API_Bot } from './api';
// Импортируем банк вопросов
import { questionBank, finalQuestion, getRandomQuestions } from './questions_bank';
dotenv.config()

//авторизация
export const token: string = String(process.env.token)
export const root: number = Number(process.env.root) //root user
export const chat_id: number = Number(process.env.chat_id) //chat for logs
export const group_id: number = Number(process.env.group_id)//clear chat group
export const timer_text = { answerTimeLimit: 300_000 } // ожидать пять минут
export const answerTimeLimit = 300_000 // ожидать пять минут
export const starting_date = new Date(); // время работы бота

// Глобальная переменная для кода сброса
export let resetCode = "1000-7";

// Картинки для факультетов (нужно заменить на реальные photo_id из альбома группы)
const facultyPhotos = {
    'grif': 'photo-224622524_457245144',
    'sliz': 'photo-224622524_457245145',
    'coga': 'photo-224622524_457245147',
    'puff': 'photo-224622524_457245146'
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
    'grif': (name: string) => `Гриффиндор! Смелость, отвага и честь — всё говорит о том, что игрок ${name} теперь в Гриффиндоре! 🦁\n\n🔥 Где храбрость, там и победа! Добро пожаловать в логово львов, где каждый день — это новое приключение!`,
    'puff': (name: string) => `Пуффендуй! Доброта, трудолюбие и верность — Шляпа уверена: игрок ${name} — настоящий Пуффендуец! 🦡\n\n🍯 Здесь ценят упорство и честность больше всего на свете! Добро пожаловать в улей трудолюбивых!`,
    'coga': (name: string) => `Когтевран! Мудрость и стремление к знаниям привели игрока ${name} в Когтевран! 🦅\n\n📚 Где ум ведёт, там и рука следует! Тебе открыты все тайны библиотеки и мудрость веков!`,
    'sliz': (name: string) => `Слизерин! Амбиции и находчивость — именно эти качества направили игрока ${name} в Слизерин! 🐍\n\n💚 Самые хитрые и целеустремленные находят здесь свой дом. Добро пожаловать в подземелья амбиций!`
};

// Варианты концовки
const postEndings = [
    "✉️ Хочешь узнать, куда попадёшь ты? Пиши в сообщения сообщества!\n👉 [https://vk.com/ho_hat|Пройти распределение]",
];

// Функция для создания поста на стене сообщества
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

async function Group_Id_Get() {
    const vk = new VK({ token: token, apiLimit: 1 });
    const [group] = await vk.api.groups.getById(vk);
    const groupId = group.id;
    return groupId
}
export const vk = new VK({ 
    token: token, 
    pollingGroupId: Number(Group_Id_Get()), 
    apiMode: "sequential", 
    apiLimit: 1 
});

//инициализация
const questionManager = new QuestionManager();
const hearManager = new HearManager<IQuestionMessageContext>();

vk.updates.use(questionManager.middleware);
vk.updates.on('message_new', hearManager.middleware);

//регистрация роутов из других классов
InitGameRoutes(hearManager)
registerUserRoutes(hearManager)

async function getGroupAdmins(): Promise<number[]> {
    try {
        // Получаем администраторов группы
        const admins = await vk.api.groups.getMembers({
            group_id: String(group_id),
            filter: 'managers'
            // Убираем fields, так как нам нужны только id
        });
        
        // Возвращаем массив ID администраторов
        return admins.items.map((admin: any) => admin.id);
    } catch (error) {
        console.error('Ошибка при получении списка администраторов:', error);
        return [root]; // В случае ошибки возвращаем хотя бы root
    }
}

// Функция для проверки, является ли пользователь администратором группы
async function isGroupAdmin(userId: number): Promise<boolean> {
    try {
        const admins = await getGroupAdmins();
        return admins.includes(userId) || userId === root;
    } catch (error) {
        console.error('Ошибка при проверке администратора:', error);
        return userId === root; // В случае ошибки проверяем только root
    }
}

// Варианты сообщений для просьбы о смене факультета
const facultyChangeWarnings = [
    "👟 Швыряет тапком\n\n⚖️ Правила Хогвартса Онлайн ясны и неизменны: распределение проходит лишь однажды! Смена факультета возможна исключительно после завершения первого курса.\n\n🚫 Если продолжишь свои манипуляции, то патруль мракоборцев доставит тебя прямиком в Азкабан.",
    
    "🪄 Магически материализует учебник правил\n\n📜 Статья N, параграф Y Устава Хогвартса Онлайн гласит: каждый ученик проходит распределение единожды. Попытка несанкционированной смены факультета карается по закону.\n\n👮‍♂️ Мракоборцы уже получили совиную почту о твоих намерениях. Следующая остановка — Азкабан.",
    
    "🧙‍♂️ Достаёт волшебную палочку и грустно качает головой\n\n🎭 Дорогой ученик, Шляпа распределила тебя не просто так! Если будешь пытаться обойти её мудрое решение, тебя ждёт:\n1) неделя отработок с Филчем\n2) чистка ночных горшков без магии;\n3) лекции о безопасности от Локонса... дважды в день!",
    
    "⚡ Вспышка молнии освещает зал\n\n🏛️ Решение Распределяющей Шляпы — закон для всех четырёх факультетов! Смена возможна только после завершения первого курса.\n\n🚔 Мракоборческий патруль 'Ночные Сыщики' уже в пути.",
    
    "🐉 Издаёт рычание, похожее на драконье\n\n🗿 Ты что, думаешь, мы просто так церемонию распределения каждый год проводим? Это сакральный ритуал!\n\n⛓️ Ещё одно слово о смене факультета — и тебя отправят:\n• на кухню к домашним эльфам на перемывание всех котлов;\n• в оранжерею №3 к мандрагорам без берушей;\n• на отработку в Запретный лес... ночью!"
];

// Варианты сообщений для возвращения в школу
const returnToSchoolMessages = [
    "🏰 Замок скрипит древними балками\n\n🔙 Если жаждешь вернуться в стены Хогвартса Онлайн, направь сову (напиши в сообщение) в самое сердце нашей администрации:\n\n📬 Сообщество Хогвартса Онлайн: https://vk.com/hogonline\n\n⚖️ Только верховный совет может вынести вердикт о твоём возвращении.",
    
    "🦉 Сова доставляет свиток\n\n📜 Прошение о повторном зачислении принимается исключительно:\n• в полнолуние;\n• на пергаменте, добытом у тролля;\n• чернилами, смешанными с пылью лунного света.\n\n🏛️ Но для начала просто напиши в сообщения сообщества: https://vk.com/hogonline.",
    
    "🧳 Старый чемодан раскрывается с треском\n\n🎓 Возвращение в Хогвартс — дело нешуточное!\n\n✍️ Начни с обращения в сообщество: https://vk.com/hogonline.",
    
    "🗝️ Звякают ключи Филча\n\n🚪 Двери Хогвартса Онлайн открываются для возвращающихся лишь по особому распоряжению.\n\n📩 Пиши сюда: https://vk.com/hogonline."
];

vk.updates.on('message_new', async (context: any, next: any) => {
    // Игнорируем сообщения из лог-чата
    if (context.peerId === chat_id) {
        return await next();
    }
    
    if (context.peerType == 'chat') { 
        return await next() 
    }
    
    try {
        const data = (await got.get(`https://vk.com/foaf.php?id=${context.senderId}`)).body;
        const arr: any = data.toString().split('<')
        for (const i in arr) {
            if (arr[i].includes(`ya:created dc:date=`)) {
                const date_read = arr[i].match(/"([^']+)"/)[1];
                const date: any = new Date(date_read)
                const date_now = Date.now()
                if (date_now-date < 2592000000) {
                    await context.send(`⁉ Вашей странице меньше месяца. Вы не можете пройти распределение сейчас. Приходите через 30 дней от даты регистрации своего аккаунта!`)
                    return;
                }
            }
        }
    } catch (error: any) {
        console.error(error.response.statusCode);
    }
    
    const user_check = await prisma.user.findFirst({
        where: {
            idvk: context.senderId
        }
    })
        
    // Если пользователь уже прошел распределение
    if (user_check) {
        // Проверяем, не является ли это кодом сброса
        if (context.text === resetCode) {
            const delatt = await prisma.user.delete({
                where: {
                    id: user_check.id
                }
            });
            if (delatt) {
                await context.send(`🎓 Волшебный код активирован! Ваш профиль ученика ${user_check.name} стирается из книг регистрации.\n\n✨ Чтобы пройти распределение, напишите "Начать"!`);
                await Logger(`Deleted ${user_check.name}`);
            }
            return;
        }
        
        // Игнорируем команды (начинающиеся с !)
        if (!context.text?.startsWith('!') && context.text) {
            // Если это не команда и не код сброса - показываем меню с ДОПОЛНИТЕЛЬНЫМИ КНОПКАМИ
            const answer = await context.question(
                `🎩 Шляпа приподнимается и смотрит на вас, прищурившись:\n"Кажется, я вас не совсем поняла. Уточните, что требуется?"`,
                {
                    keyboard: Keyboard.builder()
                    .textButton({
                        label: '🏰 Хочу другой факультет',
                        payload: {
                            command: 'change_faculty'
                        },
                        color: 'secondary'
                    })
                    .row()
                    .textButton({
                        label: '📚 Хочу вернуться в школу',
                        payload: {
                            command: 'return_to_school'
                        },
                        color: 'secondary'
                    })
                    .row()
                    .textButton({
                        label: '🔐 Ввести код сброса',
                        payload: {
                            command: 'enter_reset_code'
                        },
                        color: 'primary'
                    })
                    .row()
                    .textButton({
                        label: '❌ Отмена',
                        payload: {
                            command: 'cancel'
                        },
                        color: 'negative'
                    })
                    .oneTime().inline(),
                    answerTimeLimit: 30000
                }
            );
            
            if (answer.isTimeout) return;
            
            // ОТПРАВЛЯЕМ СООБЩЕНИЕ СРАЗУ ПОСЛЕ НАЖАТИЯ КНОПКИ
            if (answer.payload?.command === 'change_faculty') {
                const randomWarning = facultyChangeWarnings[Math.floor(Math.random() * facultyChangeWarnings.length)];
                await context.send(randomWarning);
                return;
            } 

            if (answer.payload?.command === 'return_to_school') {
                const randomMessage = returnToSchoolMessages[Math.floor(Math.random() * returnToSchoolMessages.length)];
                await context.send(randomMessage);
                return;
            } 

            if (answer.payload?.command === 'enter_reset_code') {
                const codeAnswer = await context.question(
                    `🔐 Введите магический код сброса:`,
                    {
                        keyboard: Keyboard.builder()
                        .textButton({
                            label: '❌ Отмена',
                            payload: {
                                command: 'cancel_reset'
                            },
                            color: 'negative'
                        })
                        .oneTime().inline(),
                        answerTimeLimit: 60000
                    }
                );
                
                if (codeAnswer.isTimeout) return;
                
                if (codeAnswer.payload?.command === 'cancel_reset') {
                    await context.send('❌ Операция сброса отменена.');
                    return;
                }
                
                if (codeAnswer.text === resetCode) {
                    const delatt = await prisma.user.delete({
                        where: {
                            id: user_check.id
                        }
                    });
                    if (delatt) {
                        await context.send(`🎓 Волшебный код активирован! Ваш профиль ученика (${user_check.name}) стирается из книг регистрации.\n\n✨ Чтобы пройти распределение, напишите "Начать"!`);
                        await Logger(`Deleted ${user_check.name}`);
                    }
                } else {
                    await context.send(`❌ Неверный магический код!`);
                }
                return;
            } 

            if (answer.payload?.command === 'cancel') {
                await context.send('✨ Шляпа кивает: "Хорошо, если понадобится помощь — обращайтесь!"');
                return;
            }
            
            return;
        }
        return;
    }
    
    // Если пользователь еще не прошел распределение
    if (!user_check) {
        const answer = await context.question(
            '🧷 Внимание, вопрос на миллион галлеонов: ты действительно жаждешь прикоснуться к прекрасному, то бишь пройти распределение и вступить в ряды студентов текстовой ролевой игры [https://vk.com/hogonline|Хогвартс Онлайн]? Понимаешь ли ты, что после того как древняя и местами вонючая Шляпа определит твою судьбу, на горизонте материализуется староста твоего факультета — существо, наделённое полномочиями докапываться до тебя с вопросами «ты где пропадал(а), на зельеварение забил(а), почему в банке до сих пор не зарегистрирован(а) и где вообще твоя мантия парадная»? Осознаёшь ли ты, что декана придётся не просто знать в лицо, а добавить в друзья, потому что так надо, так записано в древних свитках, и спорить с этим бесполезно? Готов(а) ли ты к тому, что твоя жизнь разделится на «до» и «после», появятся долги по учёбе, необходимость общаться с сокурсниками и прочие прелести социальной жизни, от которых некоторые специально в Хогвартс и поступают, чтобы сбежать от маггловской реальности? Если ты всё это осмыслил(а), принял(а), переварил(а) и всё ещё горишь желанием — нажимай зелёную кнопку, и да пребудет с тобой магия. Если же ты просто хотел(а) потыкать кнопки, узнать свой факультет и свалить в закат — нажми красную и живи спокойно, не множа ряды тех, кто пропадает через неделю.',
            {
                keyboard: Keyboard.builder()
                .textButton({
                    label: 'Да, я в деле, зачисляйте!',
                    payload: {
                        command: 'Согласиться'
                    },
                    color: 'positive'
                })
                .row()
                .textButton({
                    label: 'Нет, я мимо проходил(а)',
                    payload: {
                        command: 'Отказаться'
                    },
                    color: 'negative'
                }).oneTime(),
                answerTimeLimit 
            }
        );
        
        if (answer.isTimeout) { 
            await context.send('⏰ Время ожидания на подтверждение согласия истекло!')
            return;
        }
        
        if (!/да|yes|Согласиться|конечно/i.test(answer.text|| '{}')) {
            await context.send('🎩 Шляпа кивает: "Хорошо, подумайте ещё. Я всегда здесь, когда будете готовы."');
            return;
        }

        const counter_players = await prisma.user.count()
        await context.send(`🏰 Добро пожаловать в Хогвартс Онлайн! \n\n🌟 Здесь обучаются юные волшебники и волшебницы. \n🧙‍♀️ Персонал Хогвартса — это лучшие педагоги и специалисты в своих областях. \n🎉 И вот, все собрались в Большом зале, а профессор МакГонагалл надела на вас распределяющую шляпу...`);
        
        let name_check = false
        let datas: any = []
        while (name_check == false) {
            const name = await context.question(`🧷 Введите имя и фамилию персонажа (канонных персов брать нельзя, по типу Гарри Поттер и т.д.): \n❗Максимум 30 символов`, timer_text)
            if (name.isTimeout) { 
                await context.send('⏰ Время ожидания на ввод имени истекло!')
                return;
            }
            
            if (name.text.length <= 30) {
                const blacklist = [
                    "Амбридж", "Аббот", "Абернэти", "Бабблинг", "Бербидж", "Белби", "Беллчант", 
                    "Боунс", "Бидль", "Бинс", "Биннс", "Блэк", "Блек", "Блетчли", "Берк", "Бёрк", 
                    "Боунс", "Бруствер", "Булстроуд", "Бут", "Бэгмен", "Бэрбоун", "Бьюкенен", "Вейн", 
                    "Вектор", "Вуд", "Гаджен", "Гамп", "Гойл", "Голдштейн", "Голдстейн", "Гринграсс", 
                    "Грин-де-Вальд", "Гриндевальд", "Грейнджер", "Грэйнджер", "Грегорович", "Гриффиндор", 
                    "Грюм", "Гуссокл", "Дамблдор", "Делакур", "Диггори", "Диппет", "Джонсон", "Дженкинс", 
                    "Джонс", "Джордан", "Долгопупс", "Долохов", "Дурсль", "Дэвис", "Забини", "Каркаров", 
                    "Квиррелл", "Когтевран", "Ковальски", "Коллинс", "Крам", "Крауч", "Криви", "Кристал", 
                    "Кроули", "Кроткотт", "Крэбб", "Керроу", "Кэмпбелл", "Кэрроу", "Лавгуд", "Лавгут", 
                    "Лакруа", "Лестрейндж", "Локонс", "Локхарт", "Лонгботтом", "Лонгботом", "Люпин", 
                    "Макгонагалл", "МакГонагалл", "МакКиннон", "Маккормак", "Маклагген", "Макмиллан", 
                    "Мальсибер", "Малфой", "Миртл", "Монтегю", "Мракс", "Нотт", "Оллертон", "Олливандер", 
                    "Паддифут", "Паркинсон", "Патил", "Певерелл", "Пейдж", "Петтигрю", "Пинс", "Помфри", 
                    "Поттер", "Пруэтт", "Пуффендуй", "Реддл", "Реддль", "Риддл", "Розмерта", "Розье", 
                    "Роули", "Руквуд", "Саламандер", "Селвин", "Сивый", "Синистра", "Скиттер", "Скримджер", 
                    "Стебль", "Слизнорт", "Слизерин", "Снейп", "Снегг", "Снэйп", "Сэллоу", "Тонкс", 
                    "Трелони", "Трэлони", "Трэверс", "Уизли", "Фадж", "Филч", "Финниган", "Финиган", 
                    "Финч-Флэтчли", "Флинт", "Флитвик", "Фортескью", "Фоули", "Харрис", "Хагрид", 
                    "Чанг", "Шафик", "Шевалье", "Эванс", "Эйвери", "Яксли"
                ]
                
                const temp = name.text.split(' ')
                let warner = false
                
                if (name.text.replace(/[^а-яА-Я -]/gi, '') != name.text) {
                    await context.send(`💡 Внимание! Пишите только русскими символами (пробелы и дефисы разрешены)`)
                    warner = true
                }

                if (warner == false) {
                    // Проверяем на наличие канонных имен в любой части имени
                    const nameParts = name.text.split(/[\s-]+/);
                    for (let i = 0; i < nameParts.length; i++) {
                        for (let j = 0; j < blacklist.length; j++) {
                            if (nameParts[i].toLowerCase() === blacklist[j].toLowerCase()) {
                                warner = true;
                                await context.send(`⚡ Внимание! Имя "${blacklist[j]}" является запрещенным!`);
                                break;
                            }
                        }
                        if (warner) break;
                    }
                }

                if (warner == false) {
                    name_check = true
                    datas.push({name: `${name.text}`})
                } else {
                    await context.send(`✍️ Введите имя персонажа должным образом!`)
                }
                
            } else {
                await context.send(`📏 Имя должно содержать не более 30 символов!`)
            }
        }
        
        // Генерация случайных вопросов из банка
        const randomQuestions = getRandomQuestions(7); // Берем 7 случайных вопросов
        const allQuestions = [...randomQuestions, finalQuestion]; // Добавляем финальный вопрос 8-м

        let result = "";

        // Проходим по всем вопросам
        for (let qIndex = 0; qIndex < allQuestions.length; qIndex++) {
            const question = allQuestions[qIndex];
            let answer_check = false;
            
            while (answer_check == false) {
                // Создаем клавиатуру из вариантов ответа
                const keyboard = Keyboard.builder();

                // Распределяем кнопки по строкам (максимум 4 кнопки в строке)
                const options = question.options;
                
                // Если 4 кнопки - все в одну строку
                if (options.length === 4) {
                    options.forEach(option => {
                        keyboard.textButton({
                            label: option.emoji,
                            payload: { command: option.faculty },
                            color: 'secondary'
                        });
                    });
                    keyboard.row(); // Одна строка
                } 
                // Если 5 кнопок - 3 в первую строку, 2 во вторую
                else if (options.length === 5) {
                    // Первые 3 кнопки
                    for (let i = 0; i < 3; i++) {
                        keyboard.textButton({
                            label: options[i].emoji,
                            payload: { command: options[i].faculty },
                            color: 'secondary'
                        });
                    }
                    keyboard.row();
                    
                    // Оставшиеся 2 кнопки
                    for (let i = 3; i < 5; i++) {
                        keyboard.textButton({
                            label: options[i].emoji,
                            payload: { command: options[i].faculty },
                            color: 'secondary'
                        });
                    }
                    keyboard.row();
                }
                // Если 6 кнопок - по 3 в две строки
                else if (options.length === 6) {
                    // Первые 3 кнопки
                    for (let i = 0; i < 3; i++) {
                        keyboard.textButton({
                            label: options[i].emoji,
                            payload: { command: options[i].faculty },
                            color: 'secondary'
                        });
                    }
                    keyboard.row();
                    
                    // Вторые 3 кнопки
                    for (let i = 3; i < 6; i++) {
                        keyboard.textButton({
                            label: options[i].emoji,
                            payload: { command: options[i].faculty },
                            color: 'secondary'
                        });
                    }
                    keyboard.row();
                }
                // Если 7 кнопок - 4 в первую, 3 во вторую
                else if (options.length === 7) {
                    // Первые 4 кнопки
                    for (let i = 0; i < 4; i++) {
                        keyboard.textButton({
                            label: options[i].emoji,
                            payload: { command: options[i].faculty },
                            color: 'secondary'
                        });
                    }
                    keyboard.row();
                    
                    // Оставшиеся 3 кнопки
                    for (let i = 4; i < 7; i++) {
                        keyboard.textButton({
                            label: options[i].emoji,
                            payload: { command: options[i].faculty },
                            color: 'secondary'
                        });
                    }
                    keyboard.row();
                }
                // Если 8 кнопок - по 4 в две строки
                else if (options.length === 8) {
                    // Первые 4 кнопки
                    for (let i = 0; i < 4; i++) {
                        keyboard.textButton({
                            label: options[i].emoji,
                            payload: { command: options[i].faculty },
                            color: 'secondary'
                        });
                    }
                    keyboard.row();
                    
                    // Вторые 4 кнопки
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
                
                // Формируем текст с вариантами ответов
                let optionsText = '\n\n';
                question.options.forEach((opt, idx) => {
                    optionsText += `${opt.emoji} — ${opt.text}\n`;
                });

                const answer = await context.question(
                    `🧷 Вопрос ${qIndex + 1} из ${allQuestions.length}:\n\n${question.text}${optionsText}\n👇 Выберите вариант, нажав на соответствующую кнопку:`,
                    {
                        keyboard: keyboard,
                        answerTimeLimit: answerTimeLimit
                    }
                );
                
                if (answer.isTimeout) { 
                    await context.send('⏰ Время ожидания на ответ истекло!')
                    return;
                }
                
                if (!answer.payload) {
                    await context.send(`💡 Нажмите на одну из кнопок с иконками!`);
                } else {
                    result += `${answer.payload.command} `;
                    answer_check = true;
                }
            }
        }
        
        const ans = result.split(" ")
        const priority: Config | null = await prisma.config.findFirst({}) ? await prisma.config.findFirst({}) : await prisma.config.create({ data: { target1:`grif`, target2:`coga`, target3:`puff`, target4:`sliz` } })
        const target1 = priority!.target1!
        const target2 = priority!.target2!
        const target3 = priority!.target3!
        const target4 = priority!.target4!
        const complet:any = {
            [target4]: 0,
            [target3]: 0,
            [target2]: 0,
            [target1]: 0
        }
        
        for (let i=0; i < ans.length; i++) {
            if (ans[i] && complet.hasOwnProperty(ans[i])) {
                complet[`${ans[i]}`] = complet[`${ans[i]}`]+1
            }
        }
        
        const win = Object.entries(complet).reduce((acc:any, curr:any) => acc[1] > curr[1] ? acc : curr)[0]
        let get_headman: Headman | null = await prisma.headman.findFirst()
        
        const data_answer: any = {
            "coga": `💙💙🎉🎊 КОГТЕВРАН! \n\nШляпа задумчиво поёрзала на вашей голове:\n"Хм... острый ум, жажда знаний, любопытство! Определённо — КОГТЕВРАН!"\n\n🎓 Поздравляем, ученик(ца) ${datas[0].name}!\n\n🔑 Ваши следующие шаги:\n1️⃣ Подайте заявку в [https://vk.com/club203252392|гостиную Когтеврана]\n2️⃣ Пароль для входа: ЗНАНИЕ — СИЛА (отправить в сообщения сообществу)\n3️⃣ Совершите покупки в [https://vk.com/ho_bank|банке Гринготтс]\n4️⃣ Добавьте в друзья декана: https://vk.com/id638027723\n5️⃣ Ваш староста: ${get_headman?.coga}\n\n⚖️ Помните: смена факультета возможна только на 2 курсе!`,
            
            'puff': `💛💛🎉🎊 ПУФФЕНДУЙ! \n\nШляпа радостно пропела:\n"Верность, трудолюбие, честность! Без сомнений — ПУФФЕНДУЙ!"\n\n🎓 Поздравляем, ученик(ца) ${datas[0].name}!\n\n🔑 Ваши следующие шаги:\n1️⃣ Подайте заявку в [https://vk.com/club200655488|гостиную Пуффендуя]\n2️⃣ Пароль для входа: ДОБРОЕ СЕРДЦЕ (отправить в сообщения сообществу)\n3️⃣ Совершите покупки в [https://vk.com/ho_bank|банке Гринготтс]\n4️⃣ Добавьте в друзья декана: https://vk.com/id470933343\n5️⃣ Ваш староста: ${get_headman?.puff}\n\n⚖️ Помните: смена факультета возможна только на 2 курсе!`,
            
            'sliz': `💚💚🎉🎊 СЛИЗЕРИН! \n\nШляпа прошипела таинственно:\n"Амбиции, хитрость, целеустремлённость! Совершенно ясно — СЛИЗЕРИН!"\n\n🎓 Поздравляем, ученик(ца) ${datas[0].name}!\n\n🔑 Ваши следующие шаги:\n1️⃣ Подайте заявку в [https://vk.com/slytherin_hogonline|гостиную Слизерина]\n2️⃣ Пароль для входа: ЧИСТАЯ КРОВЬ (отправить в сообщения сообществу)\n3️⃣ Совершите покупки в [https://vk.com/ho_bank|банке Гринготтс]\n4️⃣ Добавьте в друзья декана: https://vk.com/psnape\n5️⃣ Ваш староста: ${get_headman?.sliz}\n\n⚖️ Помните: смена факультета возможна только на 2 курсе!`,
            
            'grif': `❤❤🎉🎊 ГРИФФИНДОР! \n\nШляпа громко прокричала:\n"Отвага, благородство, смелость! Несомненно — ГРИФФИНДОР!"\n\n🎓 Поздравляем, ученик(ца) ${datas[0].name}!\n\n🔑 Ваши следующие шаги:\n1️⃣ Подайте заявку в [https://vk.com/griffindor_hogonline|гостиную Гриффиндора]\n2️⃣ Пароль для входа: КАПУТ ДРАКОНИС (отправить в сообщения сообществу)\n3️⃣ Совершите покупки в [https://vk.com/ho_bank|банке Гринготтс]\n4️⃣ Добавьте в друзья декана: https://vk.com/id865081770\n5️⃣ Ваш староста: ${get_headman?.grif}\n\n⚖️ Помните: смена факультета возможна только на 2 курсе!`
        }
        
        await context.send(`${data_answer[win]}`)
        
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
        })
        
        await Logger(`Success save user idvk: ${context.senderId}`)
        await vk.api.messages.send({
            peer_id: chat_id,
            random_id: 0,
            message: `⚰ Поздравляем @id${context.senderId}(${datas[0].name}) \n 🏆 ${win}: 🦡${complet.puff || 0} 🦁${complet.grif || 0} 🐍${complet.sliz || 0} 🦅${complet.coga || 0}!`
        })
        
        // Создаем пост в группе с рандомными частями и картинкой
        await createFacultyPost(context, datas[0].name, win);
        
        return; // ВАЖНО: завершаем выполнение после успешной регистрации
    }
    
    // Если ни одно условие не сработало, передаем дальше
    return await next();
})

vk.updates.start().then(async () => {
    await Logger('✅ Бот успешно запущен!')
    await Start_Worker_API_Bot()
}).catch(console.error);

setInterval(Worker_Checker, 86400000);
