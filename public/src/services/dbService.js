import mongoose from 'mongoose';

// 1. Muundo wa Akaunti ya Mteja (Schema)
const clientSchema = new mongoose.Schema({
    accountName: { type: String, required: true, unique: true, lowercase: true },
    phoneNumber: { type: String, default: null },
    isActive: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    config: {
        alwaysOnline: { type: Boolean, default: true },
        antiCall: { type: Boolean, default: false },
        autoReadMessages: { type: Boolean, default: true }
    }
});

export const ClientModel = mongoose.model('Client', clientSchema);

// 2. Kazi ya kuunganisha Database
export async function connectDatabase() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error("❌ MONGODB_URI haijapatikana kwenye .env");
        
        await mongoose.connect(uri);
        console.log("🍃 [Database] MongoDB Imeunganishwa kwa unyama mwingi!");
    } catch (error) {
        console.error("❌ [Database] Kushindwa kuunganisha MongoDB:", error.message);
        process.exit(1);
    }
}
