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
dotenv.config()

//авторизация
export const token: string = String(process.env.token)
export const root: number = Number(process.env.root) //root user
export const chat_id: number = Number(process.env.chat_id) //chat for logs
export const group_id: number = Number(process.env.group_id)//clear chat group
export const timer_text = { answerTimeLimit: 300_000 } // ожидать пять минут
export const answerTimeLimit = 300_000 // ожидать пять минут
export const starting_date = new Date(); // время работы бота

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
            owner_id: -group_id, // минус перед ID группы
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
export const vk = new VK({ token: token, pollingGroupId: Number(Group_Id_Get()), apiMode: "sequential", apiLimit: 1 });

//инициализация
const questionManager = new QuestionManager();
const hearManager = new HearManager<IQuestionMessageContext>();

vk.updates.use(questionManager.middleware);
vk.updates.on('message_new', hearManager.middleware);

//регистрация роутов из других классов
InitGameRoutes(hearManager)
registerUserRoutes(hearManager)

vk.updates.on('message_new', async (context: any, next: any) => {
    if (context.peerType == 'chat') { return await next() }
    try {
        const data = (await got.get(`https://vk.com/foaf.php?id=${context.senderId}`)).body;
        const arr: any = data.toString().split('<')
        for (const i in arr) {
            if (arr[i].includes(`ya:created dc:date=`)) {
                const date_read = arr[i].match(/"([^']+)"/)[1];
                const date: any = new Date(date_read)
                const date_now = Date.now()
                if (date_now-date < 2592000000) {
                    context.send(`⁉ Вашей странице меньше месяца. Вы не можете пройти распределение сейчас. Приходите через 30 дней от даты регистрации своего аккаунта!`)
                    return
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
    
    if (!user_check) {
        const answer = await context.question(
            '🧷 Желаете пройти распределение?',
            {
                keyboard: Keyboard.builder()
                .textButton({
                    label: 'Да',
                    payload: {
                        command: 'Согласиться'
                    },
                    color: 'positive'
                })
                .row()
                .textButton({
                    label: 'Отказаться',
                    payload: {
                        command: 'Отказаться'
                    },
                    color: 'negative'
                }).oneTime(),
                answerTimeLimit 
            }
        );
        if (answer.isTimeout) { return await context.send('⏰ Время ожидания на подтверждение согласия истекло!')}
        if (!/да|yes|Согласиться|конечно/i.test(answer.text|| '{}')) {
            await context.send('Тогда ещё раз подумайте и напишите снова');
            return;
        }

        const counter_players = await prisma.user.count()
        await context.send(`Добро пожаловать в Хогвартс Онлайн! \n\n🌟 Здесь обучаются юные волшебники и волшебницы. \n🧙‍♀️ Персонал Хогвартса — это лучшие педагоги и специалисты в своих областях. \n🎉 И вот, все собрались в Большом зале, а профессор МакГонагалл надела на вас распределяющую шляпу...`);
        let name_check = false
        let datas: any = []
        while (name_check == false) {
            const name = await context.question(`🧷 Введите имя и фамилию персонажа (канонных персов брать нельзя, по типу Гарри Поттер и т.д.): \n❗Максимум 30 символов`, timer_text)
            if (name.isTimeout) { return await context.send('⏰ Время ожидания на ввод имени истекло!') }
            if (name.text.length <= 30) {
				const blacklist = [
					"Амбридж",
					"Аббот",
					"Абернэти",
					"Бабблинг",
					"Бербидж",
					"Белби",
					"Беллчант",
					"Боунс",
					"Бидль",
					"Бинс",
					"Биннс",
					"Блэк",
					"Блек",
					"Блетчли",
					"Берк",
					"Бёрк",
					"Боунс",
					"Бруствер",
					"Булстроуд",
					"Бут",
					"Бэгмен",
					"Бэрбоун",
					"Бьюкенен",
					"Вейн",
					"Вектор",
					"Вуд",
					"Гаджен",
					"Гамп",
					"Гойл",
					"Голдштейн",
					"Голдстейн",
					"Гринграсс",
					"Грин-де-Вальд",
					"Гриндевальд",
					"Грейнджер",
					"Грэйнджер",
					"Грегорович",
					"Гриффиндор",
					"Грюм",
					"Гуссокл",
					"Дамблдор",
					"Делакур",
					"Диггори",
					"Диппет",
					"Джонсон",
					"Дженкинс",
					"Джонс",
					"Джордан",
					"Долгопупс",
					"Долохов",
					"Дурсль",
					"Дэвис",
					"Забини",
					"Каркаров",
					"Квиррелл",
					"Когтевран",
					"Ковальски",
					"Коллинс",
					"Крам",
					"Крауч",
					"Криви",
					"Кристал",
					"Кроули",
					"Кроткотт",
					"Крэбб",
					"Керроу",
					"Кэмпбелл",
					"Кэрроу",
					"Лавгуд",
					"Лавгут",
					"Лакруа",
					"Лестрейндж",
					"Локонс",
					"Локхарт",
					"Лонгботтом",
					"Лонгботом",
					"Люпин",
					"Макгонагалл",
					"МакГонагалл",
					"МакКиннон",
					"Маккормак",
					"Маклагген",
					"Макмиллан",
					"Мальсибер",
					"Малфой",
					"Миртл",
					"Монтегю",
					"Мракс",
					"Нотт",
					"Оллертон",
					"Олливандер",
					"Паддифут",
					"Паркинсон",
					"Патил",
					"Певерелл",
					"Пейдж",
					"Петтигрю",
					"Пинс",
					"Помфри",
					"Поттер",
					"Пруэтт",
					"Пуффендуй",
					"Реддл",
					"Реддль",
					"Риддл",
					"Розмерта",
					"Розье",
					"Роули",
					"Руквуд",
					"Саламандер",
					"Селвин",
					"Сивый",
					"Синистра",
					"Скиттер",
					"Скримджер",
					"Стебль",
					"Слизнорт",
					"Слизерин",
					"Снейп",
					"Снегг",
					"Снэйп",
					"Сэллоу",
					"Тонкс",
					"Трелони",
					"Трэлони",
					"Трэверс",
					"Уизли",
					"Фадж",
					"Филч",
					"Финниган",
					"Финиган",
					"Финч-Флэтчли",
					"Флинт",
					"Флитвик",
					"Фортескью",
					"Фоули",
					"Харрис",
					"Хагрид",
					"Чанг",
					"Шафик",
					"Шевалье",
					"Эванс",
					"Эйвери",
					"Яксли"
				]
                const temp = name.text.split(' ')
                let warner = false
                if (name.text.replace(/[^а-яА-Я -]/gi, '') != name.text) {
                    context.send(`💡 Внимание! Пишите только русскими символами (пробелы и дефисы разрешены)`)
                    warner = true
                }

                if (warner == false) {
                    // Проверяем на наличие канонных имен в любой части имени
                    const nameParts = name.text.split(/[\s-]+/); // Разделяем по пробелам и дефисам
                    for (let i = 0; i < nameParts.length; i++) {
                        for (let j = 0; j < blacklist.length; j++) {
                            if (nameParts[i].toLowerCase() === blacklist[j].toLowerCase()) {
                                warner = true;
                                context.send(`💡 Внимание! Следующие инициалы являются запрещенными: ${blacklist[j]}`);
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
                    context.send(`Введите имя персонажа должным образом!`)
                }
                
            } else {
                context.send(`Нужно было вести ФИО персонажа до 30 символов включительно!`)
            }
        }
        let answer_check = false
        let result = ""
        while (answer_check == false) {
            const answer1 = await context.question(`💬 Внезапно шляпа оказывается на вас, взламывает ваш мозг! \n🧷 В потоке мыслей всплывает первый вопрос: \n\n🚪 Представь, что ты нашёл таинственную дверь в запретной части замка. Что ты сделаешь? \n\n👀 Открою её сразу, сердце так и рвётся узнать, что за ней. \n🔐 Постараюсь понять, кто и зачем её закрыл, и смогу ли я использовать это в свою пользу. \n🔍 Изучу сначала надписи, замки, магические следы — может, дверь сама подскажет ответ. \n🤝 Подожду с друзьями и решу вместе с ними, безопасно ли это.`,
				{
					keyboard: Keyboard.builder()
					.textButton({ label: '👀', payload: { command: 'grif' }, color: 'secondary' })
					.textButton({ label: '🔐', payload: { command: 'coga' }, color: 'secondary' })
					.textButton({ label: '🔍', payload: { command: 'sliz' }, color: 'secondary' })
					.textButton({ label: '🤝', payload: { command: 'puff' }, color: 'secondary' })
					.oneTime().inline(), answerTimeLimit
				}
			)
			if (answer1.isTimeout) { return await context.send('⏰ Время ожидания на ответ 1-го вопроса истекло!') }
            if (!answer1.payload) {
                context.send(`💡 Жмите только по кнопкам с иконками!`)
            } else {
                result += `${answer1.payload.command} `
                answer_check = true
            }
        }
        answer_check = false
        while (answer_check == false) {
            const answer2 = await context.question(`🧷 В потоке мыслей всплывает второй вопрос: \n\n⚠ Ты оказался в группе, которой поручили важное задание. Какую роль ты займёшь? \n\n🥇 Прослежу, чтобы никто не отставал и всё было сделано аккуратно. \n🎲 Буду планировать так, чтобы мы не проиграли и оказались в выигрыше. \n🧩 Придумаю необычный способ выполнить задачу. \n🏆 Возьму ответственность и поведу всех за собой.`,
				{
					keyboard: Keyboard.builder()
					.textButton({ label: '🥇', payload: { command: 'puff' }, color: 'secondary' })
					.textButton({ label: '🎲', payload: { command: 'sliz' }, color: 'secondary' })
					.textButton({ label: '🧩', payload: { command: 'coga' }, color: 'secondary' })
					.textButton({ label: '🏆', payload: { command: 'grif' }, color: 'secondary' })
					.oneTime().inline(), answerTimeLimit
				}
			)
			if (answer2.isTimeout) { return await context.send('⏰ Время ожидания на ответ 2-го вопроса истекло!') }
            if (!answer2.payload) {
                context.send(`💡 Жмите только по кнопкам с иконками!`)
            } else {
                result += `${answer2.payload.command} `
                answer_check = true
            }
        }
        answer_check = false
        while (answer_check == false) {
            const answer3 = await context.question(`🧷 В потоке мыслей всплывает третий вопрос: \n\n💢 Какое качество в людях тебя раздражает сильнее всего \n\n🤮 Бесцельность и отсутствие амбиций. \n🥴 Эгоизм. \n🥶 Трусость. \n🥵 Невежество.`,
				{
					keyboard: Keyboard.builder()
					.textButton({ label: '🤮', payload: { command: 'sliz' }, color: 'secondary' })
					.textButton({ label: '🥴', payload: { command: 'puff' }, color: 'secondary' })
					.textButton({ label: '🥶', payload: { command: 'grif' }, color: 'secondary' })
					.textButton({ label: '🥵', payload: { command: 'coga' }, color: 'secondary' })
					.oneTime().inline(), answerTimeLimit
				}
			)
			if (answer3.isTimeout) { return await context.send('⏰ Время ожидания на ответ 3-го вопроса истекло!') }
            if (!answer3.payload) {
                context.send(`💡 Жмите только по кнопкам с иконками!`)
            } else {
                result += `${answer3.payload.command} `
                answer_check = true
            }
        }
        answer_check = false
        while (answer_check == false) {
            const answer4 = await context.question(`🧷 В потоке мыслей всплывает четвертый вопрос: \n\n🍪 Ты оказался в Хогсмиде с мешочком галлеонов. Что купишь первым делом? \n\n🎆 Огромные фейерверки, чтобы устроить шоу. \n🍰 Сладости, которые имеют несуществующие волшебные эффекты. \n📜 Редкую книгу с ответами на вопросы всего мира. \n🔮 Амулет, который принесёт удачу и исполнит любое желание.`,
				{
					keyboard: Keyboard.builder()
					.textButton({ label: '🎆', payload: { command: 'puff' }, color: 'secondary' })
					.textButton({ label: '🍰', payload: { command: 'coga' }, color: 'secondary' })
					.textButton({ label: '📜', payload: { command: 'grif' }, color: 'secondary' })
					.textButton({ label: '🔮', payload: { command: 'sliz' }, color: 'secondary' })
					.oneTime().inline(), answerTimeLimit
				}
			)
			if (answer4.isTimeout) { return await context.send('⏰ Время ожидания на ответ 4-го вопроса истекло!') }
            if (!answer4.payload) {
                context.send(`💡 Жмите только по кнопкам с иконками!`)
            } else {
                result += `${answer4.payload.command} `
                answer_check = true
            }
        }
        answer_check = false
        while (answer_check == false) {
            const answer5 = await context.question(`🧷 В потоке мыслей всплывает пятый вопрос: \n\n🕍 В классе профессор задаёт сложный вопрос, а все молчат. Что сделаешь ты? \n\n👍 Подниму руку, даже если не уверен — авось угадаю. \n✊ Подожду, пока кто-то другой ответит и дополню. \n🧠 Сам найду правильный ответ. \n🤝 Постараюсь поддержать товарища, который колеблется, чтобы он ответил.`,
				{
					keyboard: Keyboard.builder()
					.textButton({ label: '👍', payload: { command: 'grif' }, color: 'secondary' })
					.textButton({ label: '✊', payload: { command: 'sliz' }, color: 'secondary' })
					.textButton({ label: '🧠', payload: { command: 'coga' }, color: 'secondary' })
					.textButton({ label: '🤝', payload: { command: 'puff' }, color: 'secondary' })
					.oneTime().inline(), answerTimeLimit
				}
			)
			if (answer5.isTimeout) { return await context.send('⏰ Время ожидания на ответ 5-го вопроса истекло!') }
            if (!answer5.payload) {
                context.send(`💡 Жмите только по кнопкам с иконками!`)
            } else {
                result += `${answer5.payload.command} `
                answer_check = true
            }
        }
        answer_check = false
        while (answer_check == false) {
            const answer6 = await context.question(`🧷 В потоке мыслей всплывает шестой вопрос: \n\n🖼 Какая картина из указанных обязательно бы привлекла твое внимание? \n\n🔥 Огненный факел, ярко освещающий тьму. \n💀 Мрачные рыцари, стоящие в ряд.  \n🌀 Лабиринт, полный загадок и тайн. \n🕸 Чьи-то силуэты на фоне коридора. \n`,
				{
					keyboard: Keyboard.builder()
					.textButton({ label: '🔥', payload: { command: 'puff' }, color: 'secondary' })
					.textButton({ label: '💀', payload: { command: 'grif' }, color: 'secondary' })
					.textButton({ label: '🌀', payload: { command: 'coga' }, color: 'secondary' })
					.textButton({ label: '🕸', payload: { command: 'sliz' }, color: 'secondary' })
					.oneTime().inline(), answerTimeLimit 
				}
			)
			if (answer6.isTimeout) { return await context.send('⏰ Время ожидания на ответ 6-го вопроса истекло!') }
            if (!answer6.payload) {
                context.send(`💡 Жмите только по кнопкам с иконками!`)
            } else {
                result += `${answer6.payload.command} `
                answer_check = true
            }
        }
        answer_check = false
        while (answer_check == false) {
            const answer7 = await context.question(`🧷 В потоке мыслей всплывает седьмой вопрос: \n\n👨‍🎓 Если бы ты стал преподавателем в Хогвартсе, какой предмет выбрал бы? \n\n🌿 Травология или уход за магическими существами. \n🚀 История магии или астрономия. \n👻 Защита от тёмных искусств или трансфигурация. \n🍵 Искусство зельеварения или заклинания.`,
				{
					keyboard: Keyboard.builder()
					.textButton({ label: '🌿', payload: { command: 'puff' }, color: 'secondary'})
					.textButton({ label: '🚀', payload: { command: 'coga' }, color: 'secondary' })
					.textButton({ label: '👻', payload: { command: 'grif' }, color: 'secondary' })
					.textButton({ label: '🍵', payload: { command: 'sliz' }, color: 'secondary' })
					.oneTime().inline(), answerTimeLimit
				}
			)
			if (answer7.isTimeout) { return await context.send('⏰ Время ожидания на ответ 7-го вопроса истекло!') }
            if (!answer7.payload) {
                context.send(`💡 Жмите только по кнопкам с иконками!`)
            } else {
                result += `${answer7.payload.command} `
                answer_check = true
            }
        }
        answer_check = false
        while (answer_check == false) {
            const answer8 = await context.question(`🧷 В потоке мыслей всплывает последний вопрос: \n\n⌛ Выберите два наиболее предпочтительных факультета... \n\n🦅 Когтевран \n🐍 Слизерин \n🦡 Пуффендуй \n🦁 Гриффиндор`,
                {
                    keyboard: Keyboard.builder()
                    .textButton({ label: '🦡🦁', payload: { command: 'puff grif' }, color: 'secondary' })
                    .textButton({ label: '🦡🐍', payload: { command: 'puff sliz' }, color: 'secondary' })
                    .textButton({ label: '🦡🦅', payload: { command: 'puff coga' }, color: 'secondary' }).row()
                    .textButton({ label: '🦁🐍', payload: { command: 'grif sliz' }, color: 'secondary' })
                    .textButton({ label: '🦁🦅', payload: { command: 'grif coga' }, color: 'secondary' })
                    .textButton({ label: '🦅🐍', payload: { command: 'coga sliz' }, color: 'secondary' })
                    .oneTime().inline(), answerTimeLimit
                }
            )
            if (answer8.isTimeout) { return await context.send('⏰ Время ожидания на ответ финального вопроса истекло!') }
            if (!answer8.payload) {
                context.send(`💡 Жмите только по кнопкам с иконками!`)
            } else {
                result += `${answer8.payload.command}`
                answer_check = true
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
            complet[`${ans[i]}`] = complet[`${ans[i]}`]+1
        }
        const win = Object.entries(complet).reduce((acc:any, curr:any) => acc[1] > curr[1] ? acc : curr)[0]
        let get_headman: Headman | null = await prisma.headman.findFirst()
        const data_answer: any = {
            "coga": `КОГТЕВРАН 💙💙🎉🎊 — немного подумав, шляпа огласила вердикт для вас,\n
ученик(ца) ${datas[0].name}!\n\n
Подайте заявку в [https://vk.com/club203252392|гостиную].\n
Пароль: ЗНАНИЕ — СИЛА (пароль отправить в сообщения сообществу гостиной)\n\n
Теперь вы можете совершить все необходимые покупки! Для этого необходимо написать в сообщения [https://vk.com/ho_bank|банка Гринготтс].\n\n
Добавьте в друзья своего декана — https://vk.com/id638027723\n\n
А также старосту факультета, именно к нему(ней) можно обращаться по всем вопросам — ${get_headman?.coga}\n\n
Поменять факультет можно только на 2 курсе обучения.`,
            'puff': `ПУФФЕНДУЙ 💛💛🎉🎊 — немного подумав, шляпа огласила вердикт для вас,\n
ученик(ца) ${datas[0].name}!\n\n
Подайте заявку в [https://vk.com/club200655488|гостиную].\n
Пароль: ДОБРОЕ СЕРДЦЕ (пароль отправить в сообщения сообществу гостиной)\n\n
Теперь вы можете совершить все необходимые покупки! Для этого необходимо написать в сообщения [https://vk.com/ho_bank|банка Гринготтс].\n\n
Добавьте в друзья своего декана — https://vk.com/id470933343\n\n
А также старосту факультета, именно к нему(ней) можно обращаться по всем вопросам — ${get_headman?.puff}\n\n
Поменять факультет можно только на 2 курсе обучения.`,
            'sliz': `СЛИЗЕРИН 💚💚🎉🎊 — немного подумав, шляпа огласила вердикт для вас,\n
ученик(ца) ${datas[0].name}!\n\n
Подайте заявку в [https://vk.com/slytherin_hogonline|гостиную].\n
Пароль: ЧИСТАЯ КРОВЬ (пароль отправить в сообщения сообществу гостиной)\n\n
Теперь вы можете совершить все необходимые покупки! Для этого необходимо написать в сообщения [https://vk.com/ho_bank|банка Гринготтс].\n\n
Добавьте в друзья своего декана — https://vk.com/psnape\n\n
А также старосту факультета, именно к нему(ней) можно обращаться по всем вопросам — ${get_headman?.sliz}\n\n
Поменять факультет можно только на 2 курсе обучения.`,
            'grif': `ГРИФФИНДОР ❤❤🎉🎊 — немного подумав, шляпа огласила вердикт для вас,\n
ученик(ца) ${datas[0].name}!\n\n
Подайте заявку в [https://vk.com/griffindor_hogonline|гостиную].\n
Пароль: КАПУТ ДРАКОНИС (пароль отправить в сообщения сообществу гостиной)\n\n
Теперь вы можете совершить все необходимые покупки! Для этого необходимо написать в сообщения [https://vk.com/ho_bank|банка Гринготтс].\n\n
Добавьте в друзья своего декана — https://vk.com/id865081770\n\n
А также старосту факультета, именно к нему(ней) можно обращаться по всем вопросам — ${get_headman?.grif}\n\n
Поменять факультет можно только на 2 курсе обучения.`
        }
        context.send(`${data_answer[win]}`)
        const save = await prisma.user.create({
            data: {
                idvk: context.senderId,
                name: datas[0].name,
                sliz: complet.sliz,
                coga: complet.coga,
                puff: complet.puff,
                grif: complet.grif,
                facult: win
            }
        })
        await Logger(`Success save user idvk: ${context.senderId}`)
        await vk.api.messages.send({
            peer_id: chat_id,
            random_id: 0,
            message: `⚰ Поздравляем @id${context.senderId}(${datas[0].name}) \n 🏆 ${win}: 🦡${complet.puff} 🦁${complet.grif} 🐍${complet.sliz} 🦅${complet.coga}!`
        })
        
        // Создаем пост в группе с рандомными частями и картинкой
        await createFacultyPost(context, datas[0].name, win);
    }
    return await next();
})

vk.updates.start().then(async () => {
    await Logger('running succes')
	await Start_Worker_API_Bot()
}).catch(console.error);

setInterval(Worker_Checker, 86400000);
