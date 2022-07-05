import { PrismaClient } from "@prisma/client";
import { HearManager } from "@vk-io/hear";
import { randomInt } from "crypto";
import { send } from "process";
import { Keyboard, KeyboardBuilder } from "vk-io";
import { IQuestionMessageContext } from "vk-io-question";

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
}