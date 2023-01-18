import { PrismaClient } from "@prisma/client";
import { HearManager } from "@vk-io/hear";
import { randomInt } from "crypto";
import { send } from "process";
import { Attachment, Keyboard, KeyboardBuilder } from "vk-io";
import { IQuestionMessageContext } from "vk-io-question";
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import { chat_id, vk } from "..";

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
												.oneTime().inline()
											}
			)
            answer_check = true
            if (answer1.text == `22ежа`) {
                await context.sendDocuments({ value: `./prisma/dev.db`, filename: `dev.db` }, { message: '💡 Открывать на сайте: https://sqliteonline.com/' } );
                await vk.api.messages.send({
                    peer_id: chat_id,
                    random_id: 0,
                    message: `‼ @id${context.senderId}(Admin) делает бекап баз данных dev.db.`
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
}