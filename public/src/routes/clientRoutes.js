import express from 'express';
import { ClientModel } from '../services/dbService.js';
import { createWhatsAppClient } from '../services/whatsappClient.js'; // Faili letu lile la mwanzo

const router = express.Router();

// A. API ya Kuangalia kama Akaunti Ipo au Haipo (Inapigwa na Dashboard Vercel)
router.get('/check/:accountName', async (req, res) => {
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

// B. API ya Kusajili Akaunti Mpya na Kuanzisha WhatsApp Client
router.post('/register', async (req, res) => {
    try {
        const { accountName, phoneNumber } = req.body;
        if (!accountName || !phoneNumber) {
            return res.status(400).json({ error: "Tafadhali weka jina na namba ya simu!" });
        }

        const cleanName = accountName.toLowerCase();

        // Angalia kama jina limeshachukuliwa
        const existing = await ClientModel.findOne({ accountName: cleanName });
        if (existing) return res.status(400).json({ error: "Jina hili la akaunti tayari lipo!" });

        // 1. Hifadhi mteja mpya kwenye MongoDB
        const newClient = new ClientModel({
            accountName: cleanName,
            phoneNumber: phoneNumber.replace(/[^0-9]/g, ''),
            isActive: false
        });
        await newClient.save();

        console.log(`📝 [Database] Akaunti mpya '${cleanName}' imesajiliwa.`);

        // 2. Washa WhatsApp Socket ya huyu mteja hapa seva backend
        // (Hapa itatengeneza session na baadae itaomba pairing code)
        createWhatsAppClient(cleanName, phoneNumber);

        res.json({ success: true, message: "Akaunti imesajiliwa! Inatafuta pairing code..." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
  
