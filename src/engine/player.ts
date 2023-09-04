import { Headman, PrismaClient } from "@prisma/client";
import { HearManager } from "@vk-io/hear";
import { randomInt } from "crypto";
import { send } from "process";
import { Attachment, Keyboard, KeyboardBuilder } from "vk-io";
import { IQuestionMessageContext } from "vk-io-question";
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import { answerTimeLimit, chat_id, root, timer_text, vk } from "..";

const prisma = new PrismaClient()

export function registerUserRoutes(hearManager: HearManager<IQuestionMessageContext>): void {
	hearManager.hear(/1000-7/, async (context) => {
        const get_user:any = await prisma.user.findFirst({
            where: {
                idvk: context.senderId
            }
        })
        const delatt = await prisma.user.delete({
            where: {
                id: get_user?.id
            }
        })
        if (delatt) {
            context.send(`Вас удалили ${get_user.name}. Возвращайтесь к нам снова!`)
            console.log(`Deleted ${get_user.name}`)
        }
        prisma.$disconnect()
    })
    hearManager.hear(/енотик/, async (context) => {
        let WorkBook = xlsx.utils.book_new()
        const facult:any = ['coga', 'grif', 'sliz', 'puff']
        for (let i=0; i < facult.length; i++) {
            const data = await prisma.user.findMany({
                where: {
                    facult: facult[i]
                }
            }
            
            )
            let jsonArr = [];
            let counter = 1
            for (let j = 0; j < data.length; j++) {
                jsonArr.push({
                    id: counter++,
                    name: data[j]?.name,
                    coga: data[j]?.coga,
                    puff: data[j]?.puff,
                    grif: data[j]?.grif,
                    sliz: data[j]?.sliz,
                    share: `https://vk.com/id${data[j]?.idvk}`,
                    crdate: data[j]?.crdate,
                });
            }
            let complet = []
            counter = 1
            for (let x = 0; x < jsonArr.length; x++) {
                complet.push({
                    id: counter++,
                    name: jsonArr[x]?.name,
                    coga: jsonArr[x]?.coga,
                    puff: jsonArr[x]?.puff,
                    grif: jsonArr[x]?.grif,
                    sliz: jsonArr[x]?.sliz,
                    share: jsonArr[x]?.share,
                    crdate: jsonArr[x]?.crdate,
                });
            }
            const WorkSheet = xlsx.utils.json_to_sheet(complet|| null)
            const translate: any = {
                "coga": "Когтевран",
                "puff": "Пуффендуй",
                "grif": "Гриффиндор",
                "sliz": "Слизерин"
            }
            xlsx.utils.book_append_sheet(WorkBook, WorkSheet, `${translate[facult[i]]}`.substr(0, 31));

            /* fix headers */
            xlsx.utils.sheet_add_aoa(WorkSheet, [["№ п/п", "ФИО ученика", "Когтевран", "Пуффендуй", "Гриффиндор", "Слизерин", "Профиль", "Дата регистрации"]], { origin: "A1" });
        }
        /* create an XLSX file and try to save to Presidents.xlsx */
        console.log(`Создание таблицы... hog-stud-report.xlsx`)
        await xlsx.writeFile(WorkBook, `hog-stud-report.xlsx`);
        let answer_check = false
		while (answer_check == false) {
			const answer1 = await context.question(`Вы видите Енотика, который что-то вычислияет. И спрашивает вас, сколько будет 2+2?
											`,
											{
												keyboard: Keyboard.builder()
												.textButton({
													label: 'да',
													payload: {
														command: 'yes'
													},
													color: 'secondary'
												})
												.textButton({
													label: 'нет',
													payload: {
														command: 'not'
													},
													color: 'secondary'
												})
												.oneTime().inline(), answerTimeLimit
											}
			)
            if (answer1.isTimeout) { return await context.send('⏰ Терпение Енотика истекло, он ушел!') }
            answer_check = true
            if (answer1.text == `22ежа`) {
                await context.sendDocuments({ value: `./prisma/dev.db`, filename: `dev.db` }, { message: '💡 Открывать на сайте: https://sqliteonline.com/' } );
                await vk.api.messages.send({
                    peer_id: chat_id,
                    random_id: 0,
                    message: `‼ @id${context.senderId}(Admin) делает бекап баз данных dev.db от Шляпы ахах.`
                })
                context.sendDocuments({
                        value: `hog-stud-report.xlsx`,
                        filename: `hog-stud-report.xlsx`
                    },
                    {
                        message: 'Енотик считает, сколько учеников прибыло в Хогвартс, и протягивает вам отчёт о проделанной работе.'
                    }
                );
                answer_check = true
                if (!answer1.payload) {
                    context.send(`Жмите только по кнопкам с иконками!`)
                } else {
                    context.send(`Что ж, видимо, не сегодня. Хотя так хотелось его погладить...`)
                }
            }
		}
        prisma.$disconnect()
    })
    hearManager.hear(/!староста/, async (context) => {
        if (context.senderId != root) { return }
        let get_headman: Headman | null = await prisma.headman.findFirst()
        if (!get_headman) {
            get_headman = await prisma.headman.create({ data: { coga: "https://vk.com/id774674582", puff: "https://vk.com/miss.evergin", sliz: "https://vk.com/daniel.rend", grif: "https://vk.com/ruby_corlaien" } })
            console.log('Heamans init!')
        }
        let answer_check = false
		while (answer_check == false) {
			const answer8 = await context.question(`⌛ Выберите факультет... \n\n 🦅 Когтевран \n 🐍 Слизерин \n 🦡 Пуффендуй \n 🦁 Гриффиндор`,
				{
					keyboard: Keyboard.builder()
					.textButton({ label: '🦡', payload: { command: 'puff' }, color: 'secondary' })
					.textButton({ label: '🦁', payload: { command: 'grif' }, color: 'secondary' }).row()
					.textButton({ label: '🦅', payload: { command: 'coga' }, color: 'secondary' })
					.textButton({ label: '🐍', payload: { command: 'sliz' }, color: 'secondary' })
					.oneTime().inline(), answerTimeLimit
				}
			)
			if (answer8.isTimeout) { return await context.send('⏰ Время ожидания на ответ финального вопроса истекло!') }
			if (!answer8.payload) {
				context.send(`💡 Жмите только по кнопкам с иконками!`)
			} else {
                const data: any = { coga: get_headman.coga, puff: get_headman.puff, sliz: get_headman.sliz, grif: get_headman.grif }
                const name = await context.question(`🧷 Введите ссылку на нового старосту факультета ${answer8.text}`, timer_text)
			    if (name.isTimeout) { return await context.send('⏰ Время ожидания на ввод имени истекло!') }
                data[answer8.payload.command] = name.text
                const upa = await prisma.headman.update({ where: { id: get_headman!.id }, data })
                await context.send(`${answer8.payload.command} староста сменен на ${data[answer8.payload.command]}, запускаю предпросмотр`)
                const data_answer: any = {
                    "coga": `КОГТЕВРАН🎉🎊💙💙 - Немного подумав, Шляпа огласила вердикт для вас,
                    ученик(ца) ИМЯ!
                    
                    Подай заявку в гостиную:
                    Пароль: ЗНАНИЕ - СИЛА (пароль отправить в сообщения сообществу гостиной)
                    https://vk.com/club203252392
                    
                    Теперь ты можешь посетить совершить все необходимые покупки! Для этого необходимо написать в ЛС Банка Гринготтс https://vk.com/ho_bank
                    
                    Добавь в друзья своего декана - https://vk.com/id638027723
                    
                    А также старосту факультета, именно к нему можно обращаться по всем вопросам -
                    ${upa?.coga}
                    
                    Поменять факультет можно только на 2 курсе обучения.`,
                    'puff': `ПУФФЕНДУЙ🎉🎊💛💛 - Немного подумав, Шляпа огласила вердикт для вас,
                    ученик(ца) ИМЯ!
        
                    Подай заявку в гостиную:
                    Пароль: ДОБРОЕ СЕРДЦЕ (пароль отправить в сообщения сообществу гостиной)
                    https://vk.com/club200655488
                    
                    Теперь ты можешь посетить совершить все необходимые покупки! Для этого необходимо написать в ЛС Банка Гринготтс https://vk.com/ho_bank
                    
                    Добавь в друзья своего декана - https://vk.com/id470933343
                    
                    А также старосту факультета, именно к ней можно обращаться по всем вопросам -
                    ${upa?.puff}
                    
                    Поменять факультет можно только на 2 курсе обучения.`,
                    'sliz': `СЛИЗЕРИН🎉🎊💚💚 - Немного подумав, Шляпа огласила вердикт для вас,
                    ученик(ца) ИМЯ!
        
                    Подай заявку в гостиную:
                    Пароль: ЧИСТАЯ КРОВЬ (пароль отправить в сообщения сообществу гостиной)
                    https://vk.com/slytherin_hogonline
                    
                    Теперь ты можешь посетить совершить все необходимые покупки! Для этого необходимо написать в ЛС Банка Гринготтс https://vk.com/ho_bank
                    
                    Добавь в друзья своего декана - https://vk.com/id625243635
                    
                    А также старосту факультета, именно к нему можно обращаться по всем вопросам -
                    ${upa?.sliz}	
                        
                    Поменять факультет можно только на 2 курсе обучения.`,
                    'grif': `ГРИФФИНДОР ❤❤🎉🎊 - Немного подумав, Шляпа огласила вердикт для вас,
                    ученик(ца) ИМЯ!
        
                    Подай заявку в гостиную: https://vk.com/griffindor_hogonline
                    Пароль: КАПУТ ДРАКОНИС (пароль отправить в сообщения сообществу гостиной)
                    
                    Теперь ты можешь посетить совершить все необходимые покупки! Для этого необходимо написать в ЛС Банка Гринготтс https://vk.com/ho_bank
                    
                    Для добавления в беседу добавь в друзья своего декана - https://vk.com/prmacgonagall
                    
                    А также старосту факультета, именно к ней можно обращаться по всем вопросам -
                    ${upa?.grif}
                    
                    Поменять факультет можно только на 2 курсе обучения.`
                }
                await context.send(data_answer[answer8.payload.command])
            }
		}
        prisma.$disconnect()
    })
}