import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { whatsappService } from "./services/whatsappService.js";
import { getCachedConfig, updateConfig, invalidateConfigCache } from "./services/configService.js";
import { requestPairingCodeFromWeb } from "./services/whatsappClient.js"; 

// Mfumo wa kupata njia sahihi ya folda (Absolute Path)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Express inaenda moja kwa moja kwenye folda la public la Dashboard wetu
app.use(express.static(path.join(__dirname, "public")));

/**
 * 📊 ENDPOINT: Angalia status ya akaunti maalum
 * Mteja anaweza kupitisha accountName kama query (mfano: /api/status?accountName=temp1)
 */
app.get("/api/status", (req, res) => {
    const { accountName } = req.query;

    if (!accountName) {
        return res.status(400).json({ error: "Tafadhali weka accountName kuona status yake!" });
    }

    const client = whatsappService.getClient(accountName);
    
    // Kwenye Multi-Account, kila session itakuwa na config yake ndani ya folda lake baadae
    // Kwa sasa tunavuta config kuu au unaweza kuweka default values
    const config = getCachedConfig(); 

    res.json({
        accountName: accountName,
        connected: !!(client && client.user),
        phone: client?.user?.id ? client.user.id.split(":")[0] : null,
        name: client?.user?.name || null,
        settings: {
            alwaysOnline: config.alwaysOnline || false,
            autoLikeStatus: config.autoLikeStatus || false,
            autoViewStatus: config.autoViewStatus || false,
            antiDelete: config.antiDelete || false,
            antiCall: config.antiCall || false,
            autoReadMessages: config.autoReadMessages || false,
            alwaysTyping: config.alwaysTyping || false,
            alwaysRecording: config.alwaysRecording || false
        }
    });
});

/**
 * 📡 ENDPOINT MPYA (MULTI-ACCOUNT): Omba Pairing Code
 * Inapokea phone na accountName kutoka kwenye Dashboard.
 */
app.post("/api/pairing-code", async (req, res) => {
    let { phone, accountName } = req.body;

    if (!phone || !accountName) {
        return res.status(400).json({ error: "Tafadhali weka namba ya simu na jina la akaunti!" });
    }

    // Safisha accountName isio na herufi za fujo (ruhusu tu herufi, namba na underscore)
    accountName = accountName.replace(/[^a-zA-Z0-9_]/g, '');
    let finalSessionId = accountName;

    try {
        console.log(`📡 Ombi jipya la Pairing Code la Member -> Jina: ${accountName}, Namba: ${phone}`);

        // 🔥 KAGUA KAMA JINA LIPO TAYARI (UTALIBADILISHA KIOTOMATIKI LISIGONGANE)
        let sessionFolder = path.join(__dirname, "auth_info", `session_${finalSessionId}`);
        let counter = 1;
        
        while (fs.existsSync(sessionFolder)) {
            finalSessionId = `${accountName}_${counter}`;
            sessionFolder = path.join(__dirname, "auth_info", `session_${finalSessionId}`);
            counter++;
        }

        if (finalSessionId !== accountName) {
            console.log(`⚠️ Jina lilikuwa lipo tayari! Limebadilishwa kuwa: ${finalSessionId}`);
        }

        // Tunatuma sasa kwenye WhatsApp Service ili iwashe session hii maalum
        const code = await whatsappService.createNewSession(finalSessionId, phone);

        res.json({ 
            success: true, 
            code: code,
            accountName: finalSessionId // Tunamrudishia mteja jina lililokubalika
        });
    } catch (error) {
        console.error(`❌ Hitilafu ya pairing kwenye akaunti ${accountName}:`, error);
        res.status(500).json({ error: error.message || "Imeshindikana kupata Pairing Code." });
    }
});

/**
 * 🗑️ ENDPOINT MPYA (MULTI-ACCOUNT): Logout na Kufuta Temp
 * Inafuta kabisa folda la siri la huyu mteja pekee ili akirudi isigome
 */
app.post("/api/logout", async (req, res) => {
    const { accountName } = req.body;

    if (!accountName) {
        return res.status(400).json({ error: "Tafadhali weka jina la akaunti unayotaka kuiondoa!" });
    }

    try {
        console.log(`🗑️ Ombi la Logout kutoka kwa Member: ${accountName}`);

        // 1. Zima socket ya huyu mteja pekee kutoka kwenye Baileys
        await whatsappService.logoutSession(accountName); 

        // 2. Tafuta njia ya kuelekea folda lake maalum la temp
        const sessionFolder = path.join(__dirname, "auth_info", `session_${accountName}`);

        // 3. Futa folda na ma-creds yake yote mazima!
        if (fs.existsSync(sessionFolder)) {
            fs.rmSync(sessionFolder, { recursive: true, force: true });
            console.log(`🧹 Folda la auth_info/session_${accountName} limefutwa kikamilifu.`);
        }

        res.json({ 
            success: true, 
            message: `Akaunti ya '${accountName}' imetolewa na faili la temp limefutwa kwa usalama!` 
        });
    } catch (error) {
        console.error(`❌ Hitilafu wakati wa kulogout akaunti ${accountName}:`, error);
        res.status(500).json({ error: "Imeshindikana kuondoa akaunti na kufuta faili la temp." });
    }
});

/**
 * 🔄 ENDPOINT: Restart akaunti maalum
 */
app.post("/api/restart", async (req, res) => {
    const { accountName } = req.body;
    if (!accountName) return res.status(400).json({ error: "Weka jina la akaunti!" });

    try {
        await whatsappService.restartSession(accountName);
        res.json({ success: true, message: `Bot ${accountName} inajirestart...` });
    } catch (error) {
        res.status(500).json({ error: "Imeshindikana kurestart bot" });
    }
});

export default app;
