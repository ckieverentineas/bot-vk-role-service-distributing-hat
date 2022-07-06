import { PrismaClient } from "@prisma/client";
import { HearManager } from "@vk-io/hear";
import { randomInt } from "crypto";
import { send } from "process";
import { Attachment, Keyboard, KeyboardBuilder } from "vk-io";
import { IQuestionMessageContext } from "vk-io-question";
import * as xlsx from 'xlsx';
import * as fs from 'fs';

const prisma = new PrismaClient()

export function registerUserRoutes(hearManager: HearManager<IQuestionMessageContext>): void {
	hearManager.hear(/0/, async (context) => {
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
    })
    hearManager.hear(/отчёт/, async (context) => {
        let WorkBook = xlsx.utils.book_new()
        const facult:any = ['coga', 'grif', 'sliz', 'puff']
        for (let i=0; i < facult.length; i++) {
            console.log(`смотри это 1 ${i}`)
            const data = await prisma.user.findMany({
                where: {
                    facult: facult[i]
                }
            }
            
            )
            let jsonArr = [];
            let counter = 1
            for (let j = 0; j < data.length; j++) {
                console.log(`смотри это 2 ${j}`)
                jsonArr.push({
                    id: counter++,
                    name: data[j].name,
                    coga: data[j].coga,
                    puff: data[j].puff,
                    grif: data[j].grif,
                    sliz: data[j].sliz,
                    share: `https://vk.com/id${data[j].idvk}`,
                    crdate: data[j].crdate,
                });
            }//return a.сумма.slice(0, -1) - b.сумма.slice(0, -1);
            jsonArr.sort(function(a:any, b:any) {return b[facult[i]].slice(0, -1) - a[facult[i]].slice(0, -1)})
            let complet = []
            counter = 1
            for (let x = 0; x < jsonArr.length; x++) {
                console.log(`смотри это 3 ${x}`)
                complet.push({
                    id: counter++,
                    name: jsonArr[i].name,
                    coga: jsonArr[i].coga,
                    puff: jsonArr[i].puff,
                    grif: jsonArr[i].grif,
                    sliz: jsonArr[i].sliz,
                    share: jsonArr[i].share,
                    crdate: jsonArr[i].crdate,
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
        console.log(`Создание таблицы... ./public/tables/full.xlsx`)
        await xlsx.writeFile(WorkBook, `full.xlsx`);
        let answer_check = false
		while (answer_check == false) {
			const answer1 = await context.question(`Отчет сгенерирован, хотите скачать?
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
			if (!answer1.payload) {
				context.send(`Жмите только по кнопкам с иконками!`)
			} else {
				if (answer1.payload.command == 'yes') {

                    context.sendDocuments({
                            value: `full.xlsx`,
                            filename: `full.xlsx`
                        },
                        {
                            message: 'тест'
                        }
                    );
                }
                answer_check = true
			}
		}

    })
}