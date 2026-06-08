import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { whatsappService } from "./services/whatsappService.js";
import { getCachedConfig, updateConfig, invalidateConfigCache } from "./services/configService.js";
import { requestPairingCodeFromWeb } from "./services/whatsappClient.js"; // Tumeimport hii function ya unyama

// 🛠️ Mfumo wa kupata njia sahihi ya folda (Absolute Path)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 HAPA TUMEPIGA MSUMARI: Express sasa itaenda moja kwa moja kwenye folda la public
app.use(express.static(path.join(__dirname, "public")));

// Bot status
app.get("/api/status", (req, res) => {
    const client = whatsappService.getClient();
    const config = getCachedConfig();

    res.json({
        connected: !!(client && client.user),
        phone: config.phone || null,
        name: config.name || null,
        settings: {
            alwaysOnline: config.alwaysOnline,
            autoLikeStatus: config.autoLikeStatus,
            autoViewStatus: config.autoViewStatus,
            antiDelete: config.antiDelete,
            antiCall: config.antiCall,
            autoReadMessages: config.autoReadMessages,
            alwaysTyping: config.alwaysTyping,
            alwaysRecording: config.alwaysRecording
        }
    });
});

// 🔥 ENDPOINT MPYA: Inapokea namba kutoka Dashboard na kurudisha Pairing Code
app.post("/api/pairing-code", async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ error: "Tafadhali weka namba ya simu sahihi" });
    }

    try {
        console.log(`📡 Dashboard imeomba Pairing Code kwa ajili ya namba: ${phone}`);
        
        // Tunavuta kodi kutoka kwenye Baileys direct!
        const code = await requestPairingCodeFromWeb(phone);
        
        // Pia tunasave namba kwenye config.json ili bot iitambue baadae
        updateConfig({ phone: phone.replace(/[^0-9]/g, '') });
        invalidateConfigCache();

        res.json({ success: true, code: code });
    } catch (error) {
        console.error("Pairing code error:", error);
        res.status(500).json({ error: error.message || "Imeshindikana kupata Pairing Code. Jaribu tena." });
    }
});

// Update settings
app.post("/api/settings", (req, res) => {
    try {
        const allowedSettings = [
            "alwaysOnline", "autoLikeStatus", "autoViewStatus",
            "antiDelete", "antiCall", "autoReadMessages",
            "alwaysTyping", "alwaysRecording", "antiViewOnce",
            "antiRemove", "prefix", "ownerNumber"
        ];

        const updates = {};
        for (const key of allowedSettings) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: "No valid settings provided" });
        }

        updateConfig(updates);
        invalidateConfigCache();

        res.json({ success: true, updated: updates });
    } catch (error) {
        console.error("Settings update error:", error);
        res.status(500).json({ error: "Failed to update settings" });
    }
});

// Restart bot connection
app.post("/api/restart", async (req, res) => {
    try {
        await whatsappService.restart();
        res.json({ success: true, message: "Bot restarting..." });
    } catch (error) {
        console.error("Restart error:", error);
        res.status(500).json({ error: "Failed to restart bot" });
    }
});

// Logout and clear session
app.post("/api/logout", async (req, res) => {
    try {
        await whatsappService.logout();
        res.json({ success: true, message: "Umelogout kikamilifu. Weka namba mpya kwenye Dashboard kupata Pairing Code." });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ error: "Failed to logout" });
    }
});

export default app;
