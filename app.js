import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { whatsappService } from "./services/whatsappService.js";
import { getCachedConfig, updateConfig, invalidateConfigCache } from "./services/configService.js";
import { requestPairingCodeFromWeb } from "./services/whatsappClient.js"; 
import { connectDatabase } from "./services/dbService.js";
import { ClientModel } from "./services/dbService.js";


// Mfumo wa kupata njia sahihi ya folda (Absolute Path)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Express inaenda moja kwa moja kwenye folda la public la Dashboard wetu
app.use(express.static(path.join(__dirname, "public")));
// Unganisha MongoDB Atlas kwa unyama mwingi
connectDatabase();


/**
 * 📊 ENDPOINT: Angalia status ya akaunti maalum
 */
app.get("/api/status", (req, res) => {
    const { accountName } = req.query;

    if (!accountName) {
        return res.status(400).json({ error: "Tafadhali weka accountName kuona status yake!" });
    }

    const client = whatsappService.getClient(accountName);
    
    // 🔥 Sasa hivi inavuta config maalum ya huyu mteja pekee!
    const config = getCachedConfig(accountName); 

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
 * 🍃 ENDPOINT: Angalia kama account ipo kwenye MongoDB (Kwa ajili ya Vercel Dashboard)
 */
app.get("/api/client/check/:accountName", async (req, res) => {
    try {
        const accountName = req.params.accountName.toLowerCase();
        const client = await ClientModel.findOne({ accountName });

        if (client) {
            return res.json({ 
                exists: true, 
                serverData: { 
                    isActive: client.isActive,
                    phoneNumber: client.phoneNumber,
                    config: client.config
                } 
            });
        } else {
            return res.json({ exists: false });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * 📡 ENDPOINT: Omba Pairing Code (MULTI-ACCOUNT)
 */
app.post("/api/pairing-code", async (req, res) => {
    let { phone, accountName } = req.body;

    if (!phone || !accountName) {
        return res.status(400).json({ error: "Tafadhali weka namba ya simu na jina la akaunti!" });
    }

    // Safisha accountName isio na herufi za fujo
    accountName = accountName.replace(/[^a-zA-Z0-9_]/g, '');
    let finalSessionId = accountName;

    try {
        console.log(`📡 Ombi jipya la Pairing Code la Member -> Jina: ${accountName}, Namba: ${phone}`);

        // Kagua kama jina lipo tayari lisionganye folda
        let sessionFolder = path.join(process.cwd(), "auth_info", `session_${finalSessionId}`);
        let counter = 1;
        
        while (fs.existsSync(sessionFolder)) {
            finalSessionId = `${accountName}_${counter}`;
            sessionFolder = path.join(process.cwd(), "auth_info", `session_${finalSessionId}`);
            counter++;
        }

        if (finalSessionId !== accountName) {
            console.log(`⚠️ Jina lilikuwa lipo tayari! Limebadilishwa kuwa: ${finalSessionId}`);
        }


         // 🔥 Inaita function sahihi tuliyoiweka kwenye whatsappClient.js kupata kodi direct!
        const code = await requestPairingCodeFromWeb(finalSessionId, phone);

        // 🍃 HAPA SASA (Mstari wa 119): Hifadhi mteja mpya au fanya update kwenye MongoDB Atlas
        await ClientModel.findOneAndUpdate(
            { accountName: finalSessionId },
            { 
                accountName: finalSessionId,
                phoneNumber: phone.replace(/[^0-9]/g, ''),
                isActive: false
            },
            { upsert: true, new: true }
        );
        console.log(`🍃 [Database] Akaunti '${finalSessionId}' imehifadhiwa kwenye MongoDB.`);

        res.json({ 
            success: true, 
            code: code,
            accountName: finalSessionId 
        });

    } catch (error) {
        console.error(`❌ Hitilafu ya pairing kwenye akaunti ${accountName}:`, error);
        res.status(500).json({ error: error.message || "Imeshindikana kupata Pairing Code." });
    }
});

/**
 * 🗑️ ENDPOINT: Logout na Kufuta Session
 */
app.post("/api/logout", async (req, res) => {
    const { accountName } = req.body;

    if (!accountName) {
        return res.status(400).json({ error: "Tafadhali weka jina la akaunti unayotaka kuiondoa!" });
    }

    try {
        console.log(`🗑️ Ombi la Logout kutoka kwa Member: ${accountName}`);

        // 🔥 Inaita function sahihi tuliyoiweka kwenye whatsappService.js
        await whatsappService.logout(accountName); 

        // Tafuta njia ya kuelekea folda lake maalum na kulisafisha kama limebaki
        const sessionFolder = path.join(process.cwd(), "auth_info", `session_${accountName}`);
        if (fs.existsSync(sessionFolder)) {
            fs.rmSync(sessionFolder, { recursive: true, force: true });
            console.log(`🧹 Folda la auth_info/session_${accountName} limefutwa kabisa.`);
        }

        res.json({ 
            success: true, 
            message: `Akaunti ya '${accountName}' imetolewa na faili la temp limefutwa kwa usalama!` 
        });
    } catch (error) {
        console.error(`❌ Hitilafu wakati wa kulogout akaunti ${accountName}:`, error);
        res.status(500).json({ error: "Imeshindikana kuondoa akaunti." });
    }
});

/**
 * 🔄 ENDPOINT: Restart akaunti maalum
 */
app.post("/api/restart", async (req, res) => {
    const { accountName } = req.body;
    if (!accountName) return res.status(400).json({ error: "Weka jina la akaunti!" });

    try {
        // 🔥 Inaita function sahihi tuliyoiweka kwenye whatsappService.js
        await whatsappService.restart(accountName);
        res.json({ success: true, message: `Bot ${accountName} inajirestart...` });
    } catch (error) {
        res.status(500).json({ error: "Imeshindikana kurestart bot" });
    }
});

export default app;
