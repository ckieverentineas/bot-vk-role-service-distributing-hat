import { MessageContext } from "vk-io";
import { QuestionMessageContext, QuestionParams, TimeoutError } from "vk-io-question";

type QuestionContext = MessageContext & QuestionMessageContext;

export async function askQuestion(
    context: QuestionContext,
    message: string,
    params?: QuestionParams
): Promise<MessageContext | null> {
    try {
        return await context.question(message, params);
    } catch (error) {
        if (error instanceof TimeoutError || (error as { name?: string })?.name === "TimeoutError") {
            return null;
        }

        throw error;
    }
}
