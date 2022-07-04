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

//авторизация
const vk = new VK({
	token: "b603c7efd00e1ce663d70a18c8915686bbdfee594a2f8d66d77620c712df5e9c2ae9e211c4164b80df6f9",
	pollingGroupId: 207638246
	//token: 'd0d096ed5933ced08bc674c08134e4e47603a0443f4972d6595024ae32f8677b62032ec53ebfddc80ff16'
});

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
			'Согласны-ли Вы на обработку персональных данных?',
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
				}).oneTime()
			}
		);
		
		if (!/да|yes|Согласиться|конечно/i.test(answer.text|| '{}')) {
			await context.send('Тогда, мы не можем совершить регистрацию');
			return;
		}

		//приветствие игрока
		const counter_players = await prisma.user.count()
		await context.send(`Добро пожаловать в Хогвартс онлайн.
							Сейчас здесь обучается: ${counter_players} учеников.
							Персонал Хогвартса онлайн: +100500 профессоров.
							И вот перед вами распределяющая шляпа...`
		);
		
		const answer1 = await context.question(`Внезапно шляпа оказывается на вас копается в вашей голове!
												В потоке мыслей всплывает первый вопрос:

												⌛ Какое зелье ты бы сварил(а)?

												💪🏻 Дающее силу
												🦷 Дающее мудрость
												⭐ Дающее известность
												❤ Любовное
											`,
											{
												keyboard: Keyboard.builder()
												.textButton({
													label: '💪🏻',
													payload: {
														command: 'grif'
													},
													color: 'secondary'
												})
												.textButton({
													label: '🦷',
													payload: {
														command: 'coga'
													},
													color: 'secondary'
												})
												.textButton({
													label: '⭐',
													payload: {
														command: 'sliz'
													},
													color: 'secondary'
												})
												.textButton({
													label: '❤',
													payload: {
														command: 'puff'
													},
													color: 'secondary'
												}).oneTime().inline()
											}
		)
		const answer2 = await context.question(`В потоке мыслей всплывает второй вопрос:

												⌛ Ты входишь в заколдованный сад. Какую из диковинок захотелось бы тебе рассмотреть первой?

												🌳 Дерево с серебряными яблоками
												🗿 Статуя старого волшебника
												🌀 Глубокий колодец
												🥀 Ярко-красные цветы
											`,
											{
												keyboard: Keyboard.builder()
												.textButton({
													label: '🌳',
													payload: {
														command: 'grif'
													},
													color: 'secondary'
												})
												.textButton({
													label: '🗿',
													payload: {
														command: 'coga'
													},
													color: 'secondary'
												})
												.textButton({
													label: '🌀',
													payload: {
														command: 'sliz'
													},
													color: 'secondary'
												})
												.textButton({
													label: '🥀',
													payload: {
														command: 'puff'
													},
													color: 'secondary'
												}).oneTime().inline()
											}
		)
		const answer3 = await context.question(`В потоке мыслей всплывает третий вопрос:

												⌛ Один раз в столетие на кустарнике Flutterby распускаются цветы, которые подстраивают свой аромат, чтобы завлечь неосторожных. Если бы кустарник заманил вас, он имел бы запах...

												🔥 Костра
												📜 Пергамента
												⚓ Моря
												🏤 Дома
											`,
											{
												keyboard: Keyboard.builder()
												.textButton({
													label: '🔥',
													payload: {
														command: 'grif'
													},
													color: 'secondary'
												})
												.textButton({
													label: '📜',
													payload: {
														command: 'coga'
													},
													color: 'secondary'
												})
												.textButton({
													label: '⚓',
													payload: {
														command: 'sliz'
													},
													color: 'secondary'
												})
												.textButton({
													label: '🏤',
													payload: {
														command: 'puff'
													},
													color: 'secondary'
												}).oneTime().inline()
											}
		)
		const answer4 = await context.question(`В потоке мыслей всплывает четвертый вопрос:

												⌛ У каждого человека есть определённые взгляды на жизнь. Что вы можете сказать о своих?

												✊ Твёрдые и постоянные.
												🤷‍♂ Очень часто меняются, иногда даже без причины.
												💥 Нужна серьёзная причина, чтобы повлиять на них.
												💬 Зачастую эти взгляды зависят от ситуации и окружающих людей.
											`,
											{
												keyboard: Keyboard.builder()
												.textButton({
													label: '✊',
													payload: {
														command: 'sliz'
													},
													color: 'secondary'
												})
												.textButton({
													label: '🤷‍♂',
													payload: {
														command: 'grif'
													},
													color: 'secondary'
												})
												.textButton({
													label: '💥',
													payload: {
														command: 'coga'
													},
													color: 'secondary'
												})
												.textButton({
													label: '💬',
													payload: {
														command: 'puff'
													},
													color: 'secondary'
												}).oneTime().inline()
											}
		)
		const answer5 = await context.question(`В потоке мыслей всплывает пятый вопрос:
												
												⌛ Какая роль вам чаще всего отведена в компании?

												🔱 Негласный лидер
												👑 Тот самый заводила, который чаще всего собирает всех гулять
												🍼 Тот самый друг-мамочка, который всегда заботится обо всех
												🧠 Тот, у кого найдётся ответ на любой вопрос
											`,
											{
												keyboard: Keyboard.builder()
												.textButton({
													label: '🔱',
													payload: {
														command: 'sliz'
													},
													color: 'secondary'
												})
												.textButton({
													label: '👑',
													payload: {
														command: 'grif'
													},
													color: 'secondary'
												})
												.textButton({
													label: '🍼',
													payload: {
														command: 'puff'
													},
													color: 'secondary'
												})
												.textButton({
													label: '🧠',
													payload: {
														command: 'coga'
													},
													color: 'secondary'
												}).oneTime().inline()
											}
		)
		const answer6 = await context.question(`В потоке мыслей всплывает шестой вопрос:

												⌛ Какой сюжет книги вас наиболее привлекает?

												💍 Атмосферный роман, полный взаимопонимания и любви между главными героями
												⚔ Боевик с сильным главным героем, который сражается против антагониста
												🔎 Детектив с находчивой главной героиней, которая постоянно находится в конфликте с окружающим её миром
												🚀 История про фантастические вселенные и их обитателей, населяющих планеты за сотни километров от земли
											`,
											{
												keyboard: Keyboard.builder()
												.textButton({
													label: '💍',
													payload: {
														command: 'puff'
													},
													color: 'secondary'
												})
												.textButton({
													label: '⚔',
													payload: {
														command: 'grif'
													},
													color: 'secondary'
												})
												.textButton({
													label: '🔎',
													payload: {
														command: 'sliz'
													},
													color: 'secondary'
												})
												.textButton({
													label: '🚀',
													payload: {
														command: 'coga'
													},
													color: 'secondary'
												}).oneTime().inline()
											}
		)
		const answer7 = await context.question(`В потоке мыслей всплывает седьмой вопрос:

												⌛ Какой ваш любимый напиток?

												🍵 Чай с лимоном
												☕ Крепкий кофе
												🍹 Свежевыжатый сок
												🍥 Какао с зефирками
											`,
											{
												keyboard: Keyboard.builder()
												.textButton({
													label: '🍵',
													payload: {
														command: 'grif'
													},
													color: 'secondary'
												})
												.textButton({
													label: '☕',
													payload: {
														command: 'coga'
													},
													color: 'secondary'
												})
												.textButton({
													label: '🍹',
													payload: {
														command: 'sliz'
													},
													color: 'secondary'
												})
												.textButton({
													label: '🍥',
													payload: {
														command: 'puff'
													},
													color: 'secondary'
												}).oneTime().inline()
											}
		)
		const answer8 = await context.question(`В потоке мыслей всплывает последний вопрос:

												⌛ На какой факультет хотелось бы больше всего?

												💙 Когтевран
												💚 Слизерин
												💛 Пуффендуй
												❤ Гриффиндор
											`,
											{
												keyboard: Keyboard.builder()
												.textButton({
													label: '💙',
													payload: {
														command: 'coga'
													},
													color: 'secondary'
												})
												.textButton({
													label: '💚',
													payload: {
														command: 'sliz'
													},
													color: 'secondary'
												})
												.textButton({
													label: '💛',
													payload: {
														command: 'puff'
													},
													color: 'secondary'
												})
												.textButton({
													label: '❤',
													payload: {
														command: 'grif'
													},
													color: 'secondary'
												}).oneTime().inline()
											}
		)
		const result = `${answer1.payload.command} ${answer2.payload.command} ${answer3.payload.command} ${answer4.payload.command} ${answer5.payload.command} ${answer6.payload.command} ${answer7.payload.command} ${answer8.payload.command}`
		const ans = result.split(" ")
		console.log(ans)
		const complet:any = {
			'grif': 0,
			'puff': 0,
			'coga': 0,
			'sliz': 0
		}
		for (let i=0; i < ans.length; i++) {
			complet[`${ans[i]}`] = complet[`${ans[i]}`]+1
		}
		console.log(complet)
		const win = Object.entries(complet).reduce((acc:any, curr:any) => acc[1] > curr[1] ? acc : curr)[0]
		console.log(`Побеждает ${win}`)
		const data_answer: any = {
			"coga": `Немного подумав, Шляпа огласила вердикт:

			ТВОЙ ФАКУЛЬТЕТ КОГТЕВРАН🎉🎊 💙💙
			
			Подай заявку в гостиную:
			Пароль: ЗНАНИЕ - СИЛА (пароль отправить в сообщения сообществу гостиной)
			https://vk.com/club203252392
			
			Теперь ты можешь посетить Косой Переулок и совершить все необходимые покупки! (https://vk.com/ho_kosalley)
			
			Добавь в друзья своего декана - https://vk.com/id638027723
			
			А также старосту факультета, именно к ней можно обращаться по всем вопросам -
			https://vk.com/adelia_dorianna_gray
			
			Поменять факультет можно только на 2 курсе обучения.`,
			'puff': `Немного подумав, Шляпа огласила вердикт:

			ТВОЙ ФАКУЛЬТЕТ ПУФФЕНДУЙ🎉🎊💛💛
			
			Подай заявку в гостиную:
			Пароль: ДОБРОЕ СЕРДЦЕ (пароль отправить в сообщения сообществу гостиной)
			https://vk.com/club200655488
			
			Теперь ты можешь посетить Косой Переулок и совершить все необходимые покупки! (https://vk.com/ho_kosalley)
			
			Добавь в друзья своего декана - https://vk.com/id470933343
			
			А также старосту факультета, именно к нему можно обращаться по всем вопросам -
			https://vk.com/chamomile_rr
			
			Поменять факультет можно только на 2 курсе обучения.`,
			'sliz': `Немного подумав, Шляпа огласила вердикт:

			ТВОЙ ФАКУЛЬТЕТ СЛИЗЕРИН🎉🎊💚💚
			
			Подай заявку в гостиную:
			Пароль: ЧИСТАЯ КРОВЬ (пароль отправить в сообщения сообществу гостиной)
			https://vk.com/slytherin_hogonline
			
			Теперь ты можешь посетить Косой Переулок и совершить все необходимые покупки! (https://vk.com/ho_kosalley)
			
			Добавь в друзья своего декана - https://vk.com/id625243635
			
			А также старосту факультета, именно к ней можно обращаться по всем вопросам -
			https://vk.com/camilla_pis
			
			Поменять факультет можно только на 2 курсе обучения.`,
			'griff': `Немного подумав, Шляпа огласила вердикт:

			ТВОЙ ФАКУЛЬТЕТ ГРИФФИНДОР ❤❤🎉🎊
			
			Подай заявку в гостиную: https://vk.com/griffindor_hogonline
			Пароль: КАПУТ ДРАКОНИС (пароль отправить в сообщения сообществу гостиной)
			
			Теперь ты можешь посетить Косой Переулок и совершить все необходимые покупки! (https://vk.com/ho_kosalley)
			
			Для добавления в беседу добавь в друзья своего декана - https://vk.com/prmacgonagall
			
			А также старосту факультета, именно к ней можно обращаться по всем вопросам -
			https://vk.com/lisabeth3011
			
			Поменять факультет можно только на 2 курсе обучения.`
		}
		context.send(`${data_answer[win]}`)
	}
	return next();
})

vk.updates.startPolling().catch(console.error);