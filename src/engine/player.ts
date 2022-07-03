import { PrismaClient } from "@prisma/client";
import { HearManager } from "@vk-io/hear";
import { randomInt } from "crypto";
import { Keyboard, KeyboardBuilder } from "vk-io";
import { IQuestionMessageContext } from "vk-io-question";

const prisma = new PrismaClient()

export function registerUserRoutes(hearManager: HearManager<IQuestionMessageContext>): void {
	
}