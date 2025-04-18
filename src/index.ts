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
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { env } from 'process';
import got from 'got';
import prisma from './engine/prisma_client';
import { Logger, Worker_Checker } from './engine/helper';
dotenv.config()
//авторизация
export const token: string = String(process.env.token)
export const root: number = Number(process.env.root) //root user
export const chat_id: number = Number(process.env.chat_id) //chat for logs
export const group_id: number = Number(process.env.group_id)//clear chat group
export const timer_text = { answerTimeLimit: 300_000 } // ожидать пять минут
export const answerTimeLimit = 300_000 // ожидать пять минут
export const starting_date = new Date(); // время работы бота
//авторизация
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
					context.send(`⁉ Вашей странице меньше месяца. Вы не можете пройти распределение сейчас. Приходите через 30 дней от даты регистрации своего аккаунта!`)
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

		//приветствие игрока
		const counter_players = await prisma.user.count()
		await context.send(`Добро пожаловать в Хогвартс Онлайн! \n\n🌟 Здесь обучаются юные волшебники и волшебницы. \n🧙‍♀️ Персонал Хогвартса — это лучшие педагоги и специалисты в своих областях. \n🎉 И вот, все собрались в Большом зале, а профессор МакГонагалл надела на вас распределяющую шляпу...`);
		let name_check = false
		let datas: any = []
		while (name_check == false) {
			const name = await context.question(`🧷 Введите имя и фамилию персонажа (канонных персов брать нельзя, по типу Гарри Поттер и т.д.): \n❗Максимум 30 символов`, timer_text)
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
					context.send(`💡 Внимание! Пишите только русскими символами (пробелы и дефисы разрешены)`)
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
			const answer1 = await context.question(`💬 Внезапно шляпа оказывается на вас, взламывает ваш мозг! \n🧷 В потоке мыслей всплывает первый вопрос: \n\n⌛ Какой твой любимый способ учиться? \n\n🤿 Погружение через край \n🔄 Постепенное совершенствование \n💥 Метод проб и ошибок \n🧩 Соединение разных дисциплин`,
				{
					keyboard: Keyboard.builder()
					.textButton({ label: '🤿', payload: { command: 'sliz' }, color: 'secondary' })
					.textButton({ label: '🔄', payload: { command: 'puff' }, color: 'secondary' })
					.textButton({ label: '💥', payload: { command: 'grif' }, color: 'secondary' })
					.textButton({ label: '🧩', payload: { command: 'coga' }, color: 'secondary' })
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
			const answer2 = await context.question(`🧷 В потоке мыслей всплывает второй вопрос: \n\n⌛ Какой тип пустоты тебя привлекает? \n\n🍂 Пустое гнездо после вылета птенцов \n🌀 Центр спирали \n🌑 Тень между светом \n🌌 Бесконечное пространство`,
				{
					keyboard: Keyboard.builder()
					.textButton({ label: '🍂', payload: { command: 'puff' }, color: 'secondary' })
					.textButton({ label: '🌀', payload: { command: 'coga' }, color: 'secondary' })
					.textButton({ label: '🌑', payload: { command: 'sliz' }, color: 'secondary' })
					.textButton({ label: '🌌', payload: { command: 'grif' }, color: 'secondary' })
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
			const answer3 = await context.question(`🧷 В потоке мыслей всплывает третий вопрос: \n\n⌛ Перед вами четыре дороги. Куда пойдёте? \n\n🔮 Тропа, усыпанная зеркальными осколками \n🌠 Мост, раскачивающийся над бездной \n✨ Туннель, где стены шепчут забытые слова \n🌫️ Тропинка, теряющаяся в тумане`,
				{
					keyboard: Keyboard.builder()
					.textButton({ label: '🔮', payload: { command: 'grif' }, color: 'secondary' })
					.textButton({ label: '🌠', payload: { command: 'coga' }, color: 'secondary' })
					.textButton({ label: '✨', payload: { command: 'sliz' }, color: 'secondary' })
					.textButton({ label: '🌫️', payload: { command: 'puff' }, color: 'secondary' })
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
			const answer4 = await context.question(`🧷 В потоке мыслей всплывает четвертый вопрос: \n\n⌛ Что вы сделаете, если найдете кошелек с кругленькой суммой? \n\n🏫 Отнесу в бюро находок \n🕵 Найду обладателя и верну лично \n🦹‍♂ Присвою себе \n👣 Оставлю, где лежал`,
				{
					keyboard: Keyboard.builder()
					.textButton({ label: '🏫', payload: { command: 'coga' }, color: 'secondary' })
					.textButton({ label: '🕵', payload: { command: 'grif' }, color: 'secondary' })
					.textButton({ label: '🦹‍♂', payload: { command: 'sliz' }, color: 'secondary' })
					.textButton({ label: '👣', payload: { command: 'puff' }, color: 'secondary' })
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
			const answer5 = await context.question(`🧷 В потоке мыслей всплывает пятый вопрос: \n\n⌛ Какое правило вы нарушите первым? \n\n🌿 Не поливай чужие цветы \n📜 Не записывай то, что можно забыть \n⚖️ Не трогай то, что уже сбалансировано \n🌪️ Не ищи закономерностей в хаосе`,
				{
					keyboard: Keyboard.builder()
					.textButton({ label: '🌿', payload: { command: 'puff' }, color: 'secondary' })
					.textButton({ label: '📜', payload: { command: 'sliz' }, color: 'secondary' })
					.textButton({ label: '⚖️', payload: { command: 'grif' }, color: 'secondary' })
					.textButton({ label: '🌪️', payload: { command: 'coga' }, color: 'secondary' })
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
			const answer6 = await context.question(`🧷 В потоке мыслей всплывает шестой вопрос: \n\n⌛ Что вы услышите в ракушке, если море исчезнет? \n\n🌊 Шёпот последней волны, которая передумала уходить \n🐚 Мелодию, которую знают только моллюски-невидимки \n🌬️ Песню ветра, который боится высоты \n👂 Гул собственного уха, слушающего само себя \n`,
				{
					keyboard: Keyboard.builder()
					.textButton({ label: '🌊', payload: { command: 'grif' }, color: 'secondary' })
					.textButton({ label: '🐚', payload: { command: 'coga' }, color: 'secondary' })
					.textButton({ label: '🌬️', payload: { command: 'puff' }, color: 'secondary' })
					.textButton({ label: '👂', payload: { command: 'sliz' }, color: 'secondary' })
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
			const answer7 = await context.question(`🧷 В потоке мыслей всплывает седьмой вопрос: \n\n⌛ Какой звук издаёт радуга при приземлении? \n\n🍁 Шуршание, как упавший осенний лист \n🐾 Глухой стук — это её тень стучится внизу \n🧪 Звон колбы, где смешивают все цвета сразу \n🎶 Аккорд, который забыли все гитары мира`,
				{
					keyboard: Keyboard.builder()
					.textButton({ label: '🍁', payload: { command: 'puff' }, color: 'secondary' })
					.textButton({ label: '🐾', payload: { command: 'sliz' }, color: 'secondary' })
					.textButton({ label: '🧪', payload: { command: 'coga' }, color: 'secondary' })
					.textButton({ label: '🎶', payload: { command: 'grif' }, color: 'secondary' })
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
			const answer8 = await context.question(`🧷 В потоке мыслей всплывает последний вопрос: \n\n⌛ Выберите два наиболее предпочтительных для вас факультета... \n\n🦅 Когтевран \n🐍 Слизерин \n🦡 Пуффендуй \n🦁 Гриффиндор`,
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
			"coga": `КОГТЕВРАН 💙💙🎉🎊 — немного подумав, шляпа огласила вердикт для вас,
			ученик(ца) ${datas[0].name}!
			
			Подайте заявку в [https://vk.com/club203252392|гостиную].
			Пароль: ЗНАНИЕ — СИЛА (пароль отправить в сообщения сообществу гостиной)
			
			Теперь вы можете совершить все необходимые покупки! Для этого необходимо написать в сообщения [https://vk.com/ho_bank|банка Гринготтс].
			
			Добавьте в друзья своего декана — https://vk.com/id638027723
			
			А также старосту факультета, именно к нему(ней) можно обращаться по всем вопросам — ${get_headman?.coga}
			
			Поменять факультет можно только на 2 курсе обучения.`,
			'puff': `ПУФФЕНДУЙ 💛💛🎉🎊 — немного подумав, шляпа огласила вердикт для вас,
			ученик(ца) ${datas[0].name}!

			Подайте заявку в [https://vk.com/club200655488|гостиную].
			Пароль: ДОБРОЕ СЕРДЦЕ (пароль отправить в сообщения сообществу гостиной)
			
			Теперь вы можете совершить все необходимые покупки! Для этого необходимо написать в сообщения [https://vk.com/ho_bank|банка Гринготтс].
			
			Добавьте в друзья своего декана — https://vk.com/id470933343
			
			А также старосту факультета, именно к нему(ней) можно обращаться по всем вопросам — ${get_headman?.puff}
			
			Поменять факультет можно только на 2 курсе обучения.`,
			'sliz': `СЛИЗЕРИН 💚💚🎉🎊 — немного подумав, шляпа огласила вердикт для вас,
			ученик(ца) ${datas[0].name}!

			Подайте заявку в [https://vk.com/slytherin_hogonline|гостиную].
			Пароль: ЧИСТАЯ КРОВЬ (пароль отправить в сообщения сообществу гостиной)
			
			Теперь вы можете совершить все необходимые покупки! Для этого необходимо написать в сообщения [https://vk.com/ho_bank|банка Гринготтс].
			
			Добавьте в друзья своего декана — https://vk.com/psnape
			
			А также старосту факультета, именно к нему(ней) можно обращаться по всем вопросам — ${get_headman?.sliz}	
				
			Поменять факультет можно только на 2 курсе обучения.`,
			'grif': `ГРИФФИНДОР ❤❤🎉🎊 — немного подумав, шляпа огласила вердикт для вас,
			ученик(ца) ${datas[0].name}!

			Подайте заявку в [https://vk.com/griffindor_hogonline|гостиную].
			Пароль: КАПУТ ДРАКОНИС (пароль отправить в сообщения сообществу гостиной)
			
			Теперь вы можете совершить все необходимые покупки! Для этого необходимо написать в сообщения [https://vk.com/ho_bank|банка Гринготтс].
			
			Добавьте в друзья своего декана — https://vk.com/id865081770
			
			А также старосту факультета, именно к нему(ней) можно обращаться по всем вопросам — ${get_headman?.grif}
			
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
	}
	return next();
})

vk.updates.start().then(() => {
	Logger('running succes')
}).catch(console.error);

setInterval(Worker_Checker, 86400000);
