import { Config, Prisma } from "@prisma/client";
import prisma from "./prisma_client";

const DEFAULT_CONFIG = {
    target1: "grif",
    target2: "coga",
    target3: "puff",
    target4: "sliz",
    resetCode: "1000-7"
};

export async function getConfig(): Promise<Config> {
    const config = await prisma.config.findFirst({
        orderBy: {
            id: "asc"
        }
    });

    if (config) {
        return config;
    }

    return prisma.config.create({
        data: DEFAULT_CONFIG
    });
}

export async function getResetCode(): Promise<string> {
    const config = await getConfig();

    return config.resetCode;
}

export async function setResetCode(resetCode: string): Promise<Config> {
    return updateConfig({
        resetCode
    });
}

export async function updateConfig(data: Prisma.ConfigUpdateInput): Promise<Config> {
    const config = await getConfig();

    return prisma.config.update({
        where: {
            id: config.id
        },
        data
    });
}
