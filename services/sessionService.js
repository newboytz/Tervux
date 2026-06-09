import { getCachedConfig, invalidateConfigCache, updateConfig } from "./configService.js";

// In-memory cache kwa ajili ya ufanisi wa kila mteja
const sessionCache = new Map();
const sessionCacheTTL = 60 * 1000; // dakika 1

/**
 * Vuta data za mipangilio ya mteja maalum (kwa kutumia accountName)
 */
export async function getSessionData(accountName) {
    if (!accountName) return null;
    
    const cached = sessionCache.get(accountName);
    if (cached && (Date.now() - cached.timestamp < sessionCacheTTL)) {
        return cached.data;
    }

    // Tunavuta config maalum ya huyu mteja
    const config = getCachedConfig(accountName);

    // Kupanga data kwa ajili ya Dashboard kuendana na mifumo ya mwanzo
    const session = {
        phone: config.phone,
        name: config.name,
        autoLikeStatus: config.autoLikeStatus,
        antiDelete: config.antiDelete,
        antiCall: config.antiCall,
        antiViewOnce: config.antiViewOnce,
        antiRemove: config.antiRemove,
        autoReadMessages: config.autoReadMessages,
        autoViewStatus: config.autoViewStatus,
        alwaysTyping: config.alwaysTyping,
        alwaysRecording: config.alwaysRecording,
        alwaysOnline: config.alwaysOnline,
        prefix: config.prefix
    };

    sessionCache.set(accountName, { data: session, timestamp: Date.now() });
    return session;
}

/**
 * Futa cache ya mteja maalum baada ya mabadiliko
 */
export function invalidateSessionCache(accountName) {
    if (!accountName) return;
    sessionCache.delete(accountName);
    invalidateConfigCache(accountName);
}

/**
 * Update mipangilio (settings) ya mteja maalum kutoka Dashboard
 */
export async function updateSessionSettings(accountName, settings) {
    if (!accountName) return false;
    
    // Tunaupdate config ya mteja husika direct
    updateConfig(accountName, settings);
    invalidateSessionCache(accountName);
    return true;
}
