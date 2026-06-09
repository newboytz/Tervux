import { createWhatsAppClient, getClient, closeClientSession } from "./whatsappClient.js";
import { existsSync } from "fs";
import { join } from "path";

export const whatsappService = {
    // 1. Kuanzisha session ya mteja maalum
    async init(accountName, phoneNumber = null) {
        try {
            console.log(`🔄 [${accountName}] Initializing WhatsApp Bot...`);

            // Path ya session ya huyu mteja maalum
            const sessionPath = join(process.cwd(), "auth_info", `session_${accountName}`);
            const hasSession = existsSync(sessionPath) && existsSync(join(sessionPath, "creds.json"));

            if (hasSession) {
                console.log(`📂 [${accountName}] Found existing session. Attempting to resume...`);
            } else {
                console.log(`📱 [${accountName}] No session found. Waiting for web dashboard action.`);
            }

            // Tunawasha socket ya mteja husika
            const client = await createWhatsAppClient(accountName, phoneNumber);
            return client;
        } catch (error) {
            console.error(`❌ Failed to initialize WhatsApp service for ${accountName}:`, error);
            throw error;
        }
    },

    // 2. Kuvuta socket ya mteja maalum
    getClient(accountName) {
        return getClient(accountName);
    },

    // 3. Kulogout na kufuta folda la mteja aliyetoka
    async logout(accountName) {
        console.log(`🗑️ Logging out and clearing session for [${accountName}]...`);
        const client = getClient(accountName);
        if (client) {
            try {
                await client.logout();
            } catch (e) {
                console.error(`Logout error for ${accountName}:`, e);
            }
        }
        // Inafunga socket na kufuta folda lake kule kwenye client
        return closeClientSession(accountName);
    },

    // 4. Kuwasha upya socket ya mteja maalum ikileta fujo
    async restart(accountName) {
        console.log(`🔄 Restarting WhatsApp connection for [${accountName}]...`);
        const client = getClient(accountName);
        if (client) {
            try {
                client.ws.close(); // Inakata connection ya sasa hivi
            } catch (e) { }
        }
        return this.init(accountName);
    }
};
