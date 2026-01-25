import { Config, Headman, PrismaClient } from "@prisma/client";
import { HearManager } from "@vk-io/hear";
import { randomInt } from "crypto";
import { send } from "process";
import { Attachment, Keyboard, KeyboardBuilder } from "vk-io";
import { IQuestionMessageContext } from "vk-io-question";
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import { answerTimeLimit, chat_id, root, timer_text, vk, resetCode } from "..";
import prisma from "./prisma_client";
import { Logger } from "./helper";

export function registerUserRoutes(hearManager: HearManager<IQuestionMessageContext>): void {
    
    hearManager.hear(/^!протего\s+(.+)/i, async (context) => {
        const newCode = context.$match[1].trim();
        if (newCode.length > 0) {
            const module = require('..');
            module.resetCode = newCode;
            
            await context.send(`🔮 Магический код обновлён!\n\n🛡️ Новый код сброса установлен: "${newCode}"\n\n⚡ Теперь любой может использовать этот код для удаления своего профиля!`);
            await Logger(`Пользователь @id${context.senderId} изменил код сброса на: ${newCode}`);
            
            // Получаем информацию о пользователе для лога
            let userInfo = `@id${context.senderId}`;
            try {
                const userData = await vk.api.users.get({
                    user_ids: [context.senderId]
                });
                if (userData && userData[0]) {
                    userInfo = `[id${context.senderId}|${userData[0].first_name} ${userData[0].last_name}]`;
                }
            } catch (error) {
                console.error('Ошибка при получении информации о пользователе:', error);
            }
            
            await vk.api.messages.send({
                peer_id: chat_id,
                random_id: 0,
                message: `🔐 ИЗМЕНЕНИЕ КОДА СБРОСА\n👤 ${userInfo}\n🔑 Новый код: "${newCode}"`
            });
        } else {
            await context.send(`❌ Неправильное заклинание!\n\n📝 Используйте: !протего [ваш_код]\n✨ Например: !протего 7777-13`);
        }
    });
    
    hearManager.hear(/енотик/, async (context) => {
        let WorkBook = xlsx.utils.book_new()
        const facult:any = ['coga', 'grif', 'sliz', 'puff']
        
        for (let i=0; i < facult.length; i++) {
            const data = await prisma.user.findMany({
                where: {
                    facult: facult[i]
                }
            })
            
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
            xlsx.utils.sheet_add_aoa(WorkSheet, [["№ п/п", "ФИО ученика", "Когтевран", "Пуффендуй", "Гриффиндор", "Слизерин", "Профиль", "Дата регистрации"]], { origin: "A1" });
        }
        
        await Logger(`📊 Создание отчёта: hog-stud-report.xlsx`)
        await xlsx.writeFile(WorkBook, `hog-stud-report.xlsx`);
        
        let answer_check = false
        while (answer_check == false) {
            const answer1 = await context.question(
                `🦝 Енотик поднимает голову от счётной машинки: \n"Привет! Я тут статистику считаю...\n\n🧮 Скажи-ка, сколько будет 2+2?"`,
                { 
                    keyboard: Keyboard.builder()
                    .textButton({ label: '4', payload: { command: 'yes' }, color: 'secondary' })
                    .textButton({ label: '22', payload: { command: 'not' }, color: 'secondary' })
                    .oneTime().inline(), 
                    answerTimeLimit
                }
            )
            
            if (answer1.isTimeout) { 
                return await context.send('⏰ Енотик зевнул: "Ладно, потом посчитаем..."') 
            }
            
            answer_check = true
            
            if (answer1.text == `22ежа`) {
                await context.sendDocuments({ 
                    value: `./prisma/hat.db`, 
                    filename: `hat.db` 
                }, { 
                    message: '🔮 Магическая база данных\n\n💡 Открывать на сайте: https://sqliteonline.com/\n\n⚡ Содержит все тайны распределяющей шляпы!' 
                });
                
                await vk.api.messages.send({
                    peer_id: chat_id,
                    random_id: 0,
                    message: `⚠️ СЕКРЕТНАЯ ОПЕРАЦИЯ\n👤 @id${context.senderId}\n📦 Экспортировал базу данных Шляпы`
                })
                
                await context.sendDocuments({
                    value: `hog-stud-report.xlsx`,
                    filename: `hog-stud-report.xlsx`
                },
                {
                    message: `🦝 Енотик протягивает вам папку: \n"Вот отчёт по всем студентам Хогвартса Онлайн!\n\n📈 Считал весь день, пока бамбук жевал премиум-класса.\n\n🎓 Здесь всё: от первого курсанта до сегодняшних новичков!"`
                });
                
            } else if (answer1.payload?.command === 'yes') {
                await context.send(`🦝 Енотик кивает: "Правильно! Но это слишком просто...\n\n📊 Вот тебе обычный отчёт по студентам!"`);
                
                await context.sendDocuments({
                    value: `hog-stud-report.xlsx`,
                    filename: `hog-stud-report.xlsx`
                },
                {
                    message: `📚 Отчёт о студентах Хогвартса Онлайн\n\n🎓 Статистика по всем факультетам\n📅 Актуально на текущую дату`
                });
                
            } else {
                await context.send(`🦝 Енотик хихикает: "Эх, жаль...\n\n📄 Но вот тебе базовый отчёт всё равно!"`);
                
                await context.sendDocuments({
                    value: `hog-stud-report.xlsx`,
                    filename: `hog-stud-report.xlsx`
                },
                {
                    message: `📊 Статистика Хогвартса\n\n🏰 Основные данные по студентам\n📈 Без магических секретов`
                });
            }
        }
    });
    
    hearManager.hear(/!староста/, async (context) => {
        if (context.senderId != root) { 
            return await context.send(`🚫 Доступ запрещён!\n\n⚡ Эта команда доступна только Хранителю Хогвартса!`) 
        }
        
        let answer_check = false
        while (answer_check == false) {
            let get_headman: Headman | null = await prisma.headman.findFirst()
            if (!get_headman) {
                get_headman = await prisma.headman.create({ 
                    data: { 
                        coga: "https://vk.com/id774674582", 
                        puff: "https://vk.com/miss.evergin", 
                        sliz: "https://vk.com/daniel.rend", 
                        grif: "https://vk.com/ruby_corlaien" 
                    } 
                })
                await Logger('👥 Старосты инициализированы!')
            }
            
            const answer8 = await context.question(
                `🎓 Выбор факультета для смены старосты\n\n⌛ Выберите факультет:`,
                {
                    keyboard: Keyboard.builder()
                    .textButton({ label: '🦡 Пуффендуй', payload: { command: 'puff' }, color: 'secondary' })
                    .textButton({ label: '🦁 Гриффиндор', payload: { command: 'grif' }, color: 'secondary' }).row()
                    .textButton({ label: '🦅 Когтевран', payload: { command: 'coga' }, color: 'secondary' })
                    .textButton({ label: '🐍 Слизерин', payload: { command: 'sliz' }, color: 'secondary' })
                    .oneTime().inline(), 
                    answerTimeLimit
                }
            )
            
            if (answer8.isTimeout) { 
                return await context.send('⏰ Время ожидания истекло!') 
            }
            
            if (!answer8.payload) {
                await context.send(`💡 Пожалуйста, используйте кнопки для выбора!`)
            } else {
                const data: any = { 
                    coga: get_headman.coga, 
                    puff: get_headman.puff, 
                    sliz: get_headman.sliz, 
                    grif: get_headman.grif 
                }
                
                const name = await context.question(
                    `✍️ Введите ссылку на нового старосту факультета ${answer8.text}:`,
                    timer_text
                )
                
                if (name.isTimeout) { 
                    return await context.send('⏰ Время ожидания истекло!') 
                }
                
                data[answer8.payload.command] = name.text
                const upa = await prisma.headman.update({ 
                    where: { id: get_headman!.id }, 
                    data 
                })
                
                await context.send(`✅ Староста успешно обновлён!\n\n🏆 Факультет: ${answer8.text}\n👤 Новый староста: ${data[answer8.payload.command]}`);
                
                await Logger(`Староста факультета ${answer8.payload.command} изменен на: ${data[answer8.payload.command]}`);
                answer_check = true
            }
        }
    });
    
    hearManager.hear(/!бекап/, async (context) => {
        if (context.senderId != root) { 
            return await context.send(`🚫 Магический щит сработал!\n\n⚡ Только Хранитель может создавать бекапы!`) 
        }
        
        await context.sendDocuments({ 
            value: `./prisma/dev.db`, 
            filename: `hogwarts_backup_${new Date().toISOString().split('T')[0]}.db` 
        }, { 
            message: '🔮 Магический бекап Хогвартса Онлайн\n\n💾 Полная база данных\n📅 Создан: ' + new Date().toLocaleString() + '\n\n⚡ Храните в надёжном месте!' 
        });
        
        await vk.api.messages.send({
            peer_id: chat_id,
            random_id: 0,
            message: `💾 СОЗДАНИЕ БЕКАПА\n👤 @id${context.senderId}\n📦 Создал резервную копию базы данных`
        })
    });
    
    hearManager.hear(/!приоритеты/, async (context) => {
        if (context.senderId != root) { 
            return await context.send(`🚫 Доступно только администрации!\n\n⚡ Настройка приоритетов — прерогатива Хранителей!`) 
        }
        
        const quest_control: Config | null = await prisma.config.findFirst({}) ? await prisma.config.findFirst({}) : await prisma.config.create({ 
            data: { 
                target1:`grif`, 
                target2:`coga`, 
                target3:`puff`, 
                target4:`sliz` 
            } 
        })
        
        let answer_check = false
        let facult = ``
        
        await context.send(
            `⚖️ Текущие приоритеты факультетов:\n\n` +
            `🥇 1-е место: ${quest_control?.target1?.toUpperCase()}\n` +
            `🥈 2-е место: ${quest_control?.target2?.toUpperCase()}\n` +
            `🥉 3-е место: ${quest_control?.target3?.toUpperCase()}\n` +
            `📊 4-е место: ${quest_control?.target4?.toUpperCase()}`
        );
        
        while (answer_check == false) {
            const answer2 = await context.question(
                `🎯 Выбор факультета для изменения приоритета\n\nВыберите факультет:`,
                {
                    keyboard: Keyboard.builder()
                    .textButton({ label: '🦡 Пуффендуй', payload: { command: 'puff' }, color: 'secondary' })
                    .textButton({ label: '🦁 Гриффиндор', payload: { command: 'grif' }, color: 'secondary' })
                    .textButton({ label: '🦅 Когтевран', payload: { command: 'coga' }, color: 'secondary' })
                    .textButton({ label: '🐍 Слизерин', payload: { command: 'sliz' }, color: 'secondary' })
                    .oneTime().inline(), 
                    answerTimeLimit
                }
            )
            
            if (answer2.isTimeout) { 
                return await context.send('⏰ Время ожидания истекло!') 
            }
            
            if (!answer2.payload) {
                await context.send(`💡 Пожалуйста, используйте кнопки для выбора!`)
            } else {
                facult += `${answer2.payload.command}`
                answer_check = true
            }
        }
        
        let answer_check2 = false
        let priority = ``
        
        while (answer_check2 == false) {
            const answer2 = await context.question(
                `📊 Установка приоритета для ${facult.toUpperCase()}\n\nВыберите место:`,
                {
                    keyboard: Keyboard.builder()
                    .textButton({ label: '🥇 1-е место', payload: { command: `1` }, color: 'secondary' })
                    .textButton({ label: '🥈 2-е место', payload: { command: `2` }, color: 'secondary' })
                    .textButton({ label: '🥉 3-е место', payload: { command: `3` }, color: 'secondary' })
                    .textButton({ label: '📊 4-е место', payload: { command: `4` }, color: 'secondary' })
                    .oneTime().inline(), 
                    answerTimeLimit
                }
            )
            
            if (answer2.isTimeout) { 
                return await context.send('⏰ Время ожидания истекло!') 
            }
            
            if (!answer2.payload) {
                await context.send(`💡 Пожалуйста, используйте кнопки для выбора!`)
            } else {
                priority += `${answer2.payload.command}`
                answer_check2 = true
            }
        }
        
        let res = null
        const facultyNames: any = {
            'puff': 'Пуффендуй',
            'grif': 'Гриффиндор',
            'coga': 'Когтевран',
            'sliz': 'Слизерин'
        }
        
        switch (priority) {
            case `1`:
                res = await prisma.config.update({ 
                    where: { id: quest_control?.id }, 
                    data: { target1: facult } 
                })
                await context.send(`✅ Приоритет обновлён!\n\n🥇 ${facultyNames[facult]} теперь на 1-м месте!`);
                break;
            case `2`:
                res = await prisma.config.update({ 
                    where: { id: quest_control?.id }, 
                    data: { target2: facult } 
                })
                await context.send(`✅ Приоритет обновлён!\n\n🥈 ${facultyNames[facult]} теперь на 2-м месте!`);
                break;
            case `3`:
                res = await prisma.config.update({ 
                    where: { id: quest_control?.id }, 
                    data: { target3: facult } 
                })
                await context.send(`✅ Приоритет обновлён!\n\n🥉 ${facultyNames[facult]} теперь на 3-м месте!`);
                break;
            case `4`:
                res = await prisma.config.update({ 
                    where: { id: quest_control?.id }, 
                    data: { target4: facult } 
                })
                await context.send(`✅ Приоритет обновлён!\n\n📊 ${facultyNames[facult]} теперь на 4-м месте!`);
                break;
        }
        
        if (res) {
            await context.send(
                `📈 Обновлённые приоритеты:\n\n` +
                `🥇 1-е место: ${res?.target1?.toUpperCase()}\n` +
                `🥈 2-е место: ${res?.target2?.toUpperCase()}\n` +
                `🥉 3-е место: ${res?.target3?.toUpperCase()}\n` +
                `📊 4-е место: ${res?.target4?.toUpperCase()}\n\n` +
                `⚡ Изменения вступят в силу для следующих распределений!`
            );
        }
    });
}