import { VK, Keyboard, IMessageContextSendOptions, ContextDefaultState, MessageContext } from 'vk-io';
import { HearManager } from '@vk-io/hear';
import { PrismaClient } from '@prisma/client'
import {
    QuestionManager,
    IQuestionMessageContext
} from 'vk-io-question';
import { randomInt } from 'crypto';
import { timeStamp } from 'console';
import { registerUserRoutes } from './engine/player'
import { InitGameRoutes } from './engine/init';
import { send } from 'process';
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { env } from 'process';
import got = require('got');
dotenv.config()
//авторизация
export const token: string = String(process.env.token)
export const root: number = Number(process.env.root) //root user
export const chat_id: number = Number(process.env.chat_id) //chat for logs
export const group_id: number = Number(process.env.group_id)//clear chat group
export const timer_text = { answerTimeLimit: 300_000 } // ожидать пять минут
export const answerTimeLimit = 300_000 // ожидать пять минут
//авторизация
export const vk = new VK({ token: token, pollingGroupId: group_id, apiMode: "sequential", apiLimit: 1 });

//инициализация
const questionManager = new QuestionManager();
const hearManager = new HearManager<IQuestionMessageContext>();
const prisma = new PrismaClient()

/*prisma.$use(async (params, next) => {
	console.log('This is middleware!')
	// Modify or interrogate params here
	console.log(params)
	return next(params)
})*/

//настройка
vk.updates.use(questionManager.middleware);
vk.updates.on('message_new', hearManager.middleware);

//регистрация роутов из других классов
InitGameRoutes(hearManager)
registerUserRoutes(hearManager)


//миддлевар для предварительной обработки сообщений
vk.updates.on('message_new', async (context: any, next: any) => {
	try {
		const data = (await got.get(`https://vk.com/foaf.php?id=${context.senderId}`)).body;
		const arr: any = data.toString().split('<')
		for (const i in arr) {
			if (arr[i].includes(`ya:created dc:date=`)) {
				const date_read = arr[i].match(/"([^']+)"/)[1];
				const date: any = new Date(date_read)
				const date_now = Date.now()
				if (date_now-date < 2592000000) {
					context.send(`⁉ Вашей странице меньше месяца. вы не можете пройти распределение`)
					return
				}
			}
		}
	} catch (error: any) {
		console.error(error.response.statusCode);
	}
	//проверяем есть ли пользователь в базах данных
	const user_check = await prisma.user.findFirst({
		where: {
			idvk: context.senderId
		}
	})
	//если пользователя нет, то начинаем регистрацию
	if (!user_check) {
		//согласие на обработку
		const answer = await context.question(
			'🧷 Желаете пройти распределение?',
			{
				keyboard: Keyboard.builder()
				.textButton({
					label: 'да',
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

		//приветствие игрока
		const counter_players = await prisma.user.count()
		await context.send(`Добро пожаловать в Хогвартс онлайн. \n Здесь обучаются юные волшебники и волшебницы Британии. \n Персонал Хогвартса онлайн - это лучшие педагоги и специалисты в своих областях. \n И вот все они собрались в Большом зале, а профессор МакГонагалл надела на вас распределяющую шляпу...`);
		let name_check = false
		let datas: any = []
		while (name_check == false) {
			const name = await context.question(`🧷 Введите имя персонажа (канонных персов брать нельзя, по типу Гарри Поттер и т.д.): \n ❗Максимум 30 символов`, timer_text)
			if (name.isTimeout) { return await context.send('⏰ Время ожидания на ввод имени истекло!') }
			if (name.text.length <= 30) {
				const  blacklist = [
					"Блэк", "Блек",
					"Харрис", "Уизли", "Браун", "Дамблдор", "Лестрейндж", "Поттер",
					"Грин-де-Вальд", "Грейнджер", "Малфой", "Лавгуд", "Люпин",
					"Снейп", "Снегг",
					"Мракс",
					"Реддл", "Реддль",
					"Керроу", "Кэрроу",
					"Эванс", "Гриндевальд"
				]
				const temp = name.text.split(' ')
				let warner = false
				if (name.text.replace(/[^а-яА-Я -]/gi, '') != name.text) {
					context.send(`💡 Внимание! Пишите только Русскими символами (пробелы и дефисы разрешены)`)
					warner = true
				}
				for (let i = 0; i < temp.length; i++) {
					for (let j = 0; j < blacklist.length; j++) {
						if (temp[i].toLowerCase() == blacklist[j].toLowerCase()) {
							warner = true
							context.send(`💡 Внимание! Следующие инициалы являются запрещенными: ${blacklist[j]}`)
						}
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
			const answer1 = await context.question(`💬 Внезапно шляпа оказывается на вас, копается в вашей голове! \n 🧷 В потоке мыслей всплывает первый вопрос: \n\n ⌛ Какое зелье ты бы сварил(а)? \n\n 💪🏻 Дающее силу \n 🦷 Дающее мудрость \n ⭐ Дающее известность \n ❤ Любовное`,
				{
					keyboard: Keyboard.builder()
					.textButton({ label: '💪🏻', payload: { command: 'grif' }, color: 'secondary' })
					.textButton({ label: '🦷', payload: { command: 'coga' }, color: 'secondary' })
					.textButton({ label: '⭐', payload: { command: 'sliz' }, color: 'secondary' })
					.textButton({ label: '❤', payload: { command: 'puff' }, color: 'secondary' })
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
			const answer2 = await context.question(`🧷 В потоке мыслей всплывает второй вопрос: \n\n ⌛ Ты входишь в заколдованный сад. Какую из диковинок захотелось бы тебе рассмотреть первой? \n\n 🌳 Дерево с серебряными яблоками \n 🗿 Статуя старого волшебника \n 🌀 Глубокий колодец \n 🥀 Ярко-красные цветы`,
				{
					keyboard: Keyboard.builder()
					.textButton({ label: '🌳', payload: { command: 'grif' }, color: 'secondary' })
					.textButton({ label: '🗿', payload: { command: 'coga' }, color: 'secondary' })
					.textButton({ label: '🌀', payload: { command: 'sliz' }, color: 'secondary' })
					.textButton({ label: '🥀', payload: { command: 'puff' }, color: 'secondary' })
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
			const answer3 = await context.question(`🧷 В потоке мыслей всплывает третий вопрос: \n\n ⌛ Один раз в столетие на кустарнике Flutterby распускаются цветы, которые подстраивают свой аромат, чтобы завлечь неосторожных. Если бы кустарник заманил вас, он имел бы запах... \n\n 🔥 Костра \n 📜 Пергамента \n ⚓ Моря \n 🏤 Дома`,
				{
					keyboard: Keyboard.builder()
					.textButton({ label: '🔥', payload: { command: 'grif' }, color: 'secondary' })
					.textButton({ label: '📜', payload: { command: 'coga' }, color: 'secondary' })
					.textButton({ label: '⚓', payload: { command: 'sliz' }, color: 'secondary' })
					.textButton({ label: '🏤', payload: { command: 'puff' }, color: 'secondary' })
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
			const answer4 = await context.question(`🧷 В потоке мыслей всплывает четвертый вопрос: \n\n ⌛ У каждого человека есть определённые взгляды на жизнь. Что вы можете сказать о своих? \n\n ✊ Твёрдые и постоянные. \n 🤷‍♂ Очень часто меняются, иногда даже без причины. \n 💥 Нужна серьёзная причина, чтобы повлиять на них. \n 💬 Зачастую эти взгляды зависят от ситуации и окружающих людей.`,
				{
					keyboard: Keyboard.builder()
					.textButton({ label: '✊', payload: { command: 'sliz' }, color: 'secondary' })
					.textButton({ label: '🤷‍♂', payload: { command: 'grif' }, color: 'secondary' })
					.textButton({ label: '💥', payload: { command: 'coga' }, color: 'secondary' })
					.textButton({ label: '💬', payload: { command: 'puff' }, color: 'secondary' })
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
			const answer5 = await context.question(`🧷 В потоке мыслей всплывает пятый вопрос: \n\n ⌛ Какая роль вам чаще всего отведена в компании? \n\n 🔱 Негласный лидер \n 👑 Тот самый заводила, который чаще всего собирает всех гулять \n 🍼 Тот самый друг-мамочка, который всегда заботится обо всех \n 🧠 Тот, у кого найдётся ответ на любой вопрос`,
				{
					keyboard: Keyboard.builder()
					.textButton({ label: '🔱', payload: { command: 'sliz' }, color: 'secondary' })
					.textButton({ label: '👑', payload: { command: 'grif' }, color: 'secondary' })
					.textButton({ label: '🍼', payload: { command: 'puff' }, color: 'secondary' })
					.textButton({ label: '🧠', payload: { command: 'coga' }, color: 'secondary' })
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
			const answer6 = await context.question(`🧷 В потоке мыслей всплывает шестой вопрос: \n\n ⌛ Какой сюжет книги вас наиболее привлекает? \n\n 💍 Атмосферный роман, полный взаимопонимания и любви между главными героями \n ⚔ Боевик с сильным главным героем, который сражается против антагониста \n 🔎 Детектив с находчивой главной героиней, которая постоянно находится в конфликте с окружающим её миром \n 🚀 История про фантастические вселенные и их обитателей, населяющих планеты за сотни километров от земли \n`,
				{
					keyboard: Keyboard.builder()
					.textButton({ label: '💍', payload: { command: 'puff' }, color: 'secondary' })
					.textButton({ label: '⚔', payload: { command: 'grif' }, color: 'secondary' })
					.textButton({ label: '🔎', payload: { command: 'sliz' }, color: 'secondary' })
					.textButton({ label: '🚀', payload: { command: 'coga' }, color: 'secondary' })
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
			const answer7 = await context.question(`🧷 В потоке мыслей всплывает седьмой вопрос: \n\n ⌛ Какой ваш любимый напиток? \n\n 🍵 Чай с лимоном \n ☕ Крепкий кофе \n 🍹 Свежевыжатый сок \n 🍥 Какао с зефирками`,
				{
					keyboard: Keyboard.builder()
					.textButton({ label: '🍵', payload: { command: 'grif' }, color: 'secondary' })
					.textButton({ label: '☕', payload: { command: 'coga' }, color: 'secondary' })
					.textButton({ label: '🍹', payload: { command: 'sliz' }, color: 'secondary' })
					.textButton({ label: '🍥', payload: { command: 'puff' }, color: 'secondary'
					}).oneTime().inline(), answerTimeLimit
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
			const answer8 = await context.question(`🧷 В потоке мыслей всплывает последний вопрос: \n\n ⌛ Выберите два наиболее предпочтительных для вас факультета... \n\n 🦅 Когтевран \n 🐍 Слизерин \n 🦡 Пуффендуй \n 🦁 Гриффиндор`,
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
		const complet:any = {
			'sliz': 0,
			'grif': 0,
			'coga': 0,
			'puff': 0
		}
		for (let i=0; i < ans.length; i++) {
			complet[`${ans[i]}`] = complet[`${ans[i]}`]+1
		}
		const win = Object.entries(complet).reduce((acc:any, curr:any) => acc[1] > curr[1] ? acc : curr)[0]
		const data_answer: any = {
			"coga": `КОГТЕВРАН🎉🎊💙💙 - Немного подумав, Шляпа огласила вердикт для вас,
			ученик(ца) ${datas[0].name}!
			
			Подай заявку в гостиную:
			Пароль: ЗНАНИЕ - СИЛА (пароль отправить в сообщения сообществу гостиной)
			https://vk.com/club203252392
			
			Теперь ты можешь посетить Косой Переулок и совершить все необходимые покупки! (https://vk.com/ho_kosalley)
			
			Добавь в друзья своего декана - https://vk.com/id638027723
			
			А также старосту факультета, именно к ней можно обращаться по всем вопросам -
			https://vk.com/id332431318
			
			Поменять факультет можно только на 2 курсе обучения.`,
			'puff': `ПУФФЕНДУЙ🎉🎊💛💛 - Немного подумав, Шляпа огласила вердикт для вас,
			ученик(ца) ${datas[0].name}!

			Подай заявку в гостиную:
			Пароль: ДОБРОЕ СЕРДЦЕ (пароль отправить в сообщения сообществу гостиной)
			https://vk.com/club200655488
			
			Теперь ты можешь посетить Косой Переулок и совершить все необходимые покупки! (https://vk.com/ho_kosalley)
			
			Добавь в друзья своего декана - https://vk.com/id470933343
			
			А также старосту факультета, именно к нему можно обращаться по всем вопросам -
			https://vk.com/chamomile_rr
			
			Поменять факультет можно только на 2 курсе обучения.`,
			'sliz': `СЛИЗЕРИН🎉🎊💚💚 - Немного подумав, Шляпа огласила вердикт для вас,
			ученик(ца) ${datas[0].name}!

			Подай заявку в гостиную:
			Пароль: ЧИСТАЯ КРОВЬ (пароль отправить в сообщения сообществу гостиной)
			https://vk.com/slytherin_hogonline
			
			Теперь ты можешь посетить Косой Переулок и совершить все необходимые покупки! (https://vk.com/ho_kosalley)
			
			Добавь в друзья своего декана - https://vk.com/id625243635
			
			А также старосту факультета, именно к ней можно обращаться по всем вопросам -
			https://vk.com/camilla_pis
			
			Поменять факультет можно только на 2 курсе обучения.`,
			'grif': `ГРИФФИНДОР ❤❤🎉🎊 - Немного подумав, Шляпа огласила вердикт для вас,
			ученик(ца) ${datas[0].name}!

			Подай заявку в гостиную: https://vk.com/griffindor_hogonline
			Пароль: КАПУТ ДРАКОНИС (пароль отправить в сообщения сообществу гостиной)
			
			Теперь ты можешь посетить Косой Переулок и совершить все необходимые покупки! (https://vk.com/ho_kosalley)
			
			Для добавления в беседу добавь в друзья своего декана - https://vk.com/prmacgonagall
			
			А также старосту факультета, именно к ней можно обращаться по всем вопросам -
			https://vk.com/lisabeth3011
			
			Поменять факультет можно только на 2 курсе обучения.`
		}
		context.send(`${data_answer[win]}`)
		const save = await prisma.user.create({
			data: {
				idvk: context.senderId,
				name: datas[0].name,
				coga: complet.coga,
				puff: complet.puff,
				grif: complet.grif,
				sliz: complet.sliz,
				facult: win
			}
		})
		console.log(`Success save user idvk: ${context.senderId}`)
		await vk.api.messages.send({
			peer_id: chat_id,
			random_id: 0,
			message: `⚰ Поздравляем @id${context.senderId}(${datas[0].name}) \n 🏆 ${win}: 🦡${complet.puff} 🦁${complet.grif} 🐍${complet.sliz} 🦅${complet.coga}!`
		})
	}
	prisma.$disconnect()
	return next();
})

vk.updates.startPolling().catch(console.error);