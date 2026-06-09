import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const AUTH_DIR = join(process.cwd(), "auth_info");

// Default configuration kwa mteja mpya
const DEFAULT_CONFIG = {
    phone: "",
    name: "Bot User",
    autoLikeStatus: false,
    antiDelete: false,
    antiCall: false,
    antiViewOnce: false,
    antiRemove: false,
    autoReadMessages: false,
    autoViewStatus: false,
    alwaysTyping: false,
    alwaysRecording: false,
    alwaysOnline: false,
    prefix: "!",
    ownerNumber: ""
};

// Hakikisha folda kuu la auth_info lipo
if (!existsSync(AUTH_DIR)) {
    mkdirSync(AUTH_DIR, { recursive: true });
}

/**
 * 🛠️ Helper ya kupata path ya config ya mteja maalum
 */
function getUserConfigPath(accountName) {
    if (!accountName) {
        // Kama jina halijapita (kwa dharura), inatupa ya folder kuu
        return join(process.cwd(), "config.json"); 
    }
    const userSessionDir = join(AUTH_DIR, `session_${accountName}`);
    if (!existsSync(userSessionDir)) {
        mkdirSync(userSessionDir, { recursive: true });
    }
    return join(userSessionDir, "config.json");
}

/**
 * Load configuration kutoka kwa mteja maalum
 */
export function loadConfig(accountName) {
    let fileConfig = {};
    const configPath = getUserConfigPath(accountName);
    
    try {
        if (existsSync(configPath)) {
            const data = readFileSync(configPath, "utf-8");
            fileConfig = JSON.parse(data);
        }
    } catch (err) {
        console.error(`❌ Failed to load config for ${accountName || 'system'}:`, err.message);
    }

    return {
        ...DEFAULT_CONFIG,
        ...fileConfig,
        phone: fileConfig.phone || DEFAULT_CONFIG.phone,
        ownerNumber: fileConfig.ownerNumber || DEFAULT_CONFIG.ownerNumber,
        prefix: process.env.PREFIX || fileConfig.prefix || DEFAULT_CONFIG.prefix
    };
}

/**
 * Save configuration kwa mteja maalum
 */
export function saveConfig(accountName, config) {
    const configPath = getUserConfigPath(accountName);
    try {
        writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
        console.log(`✅ Config saved successfully for [${accountName || 'system'}]`);
        return true;
    } catch (err) {
        console.error(`❌ Failed to save config for ${accountName || 'system'}:`, err.message);
        return false;
    }
}

/**
 * Update settings za mteja maalum
 */
export function updateConfig(accountName, updates) {
    const config = loadConfig(accountName);
    const newConfig = { ...config, ...updates };
    const success = saveConfig(accountName, newConfig);
    if (success) {
        invalidateConfigCache(accountName);
    }
    return success;
}

/**
 * Get specific setting ya mteja
 */
export function getSetting(accountName, key) {
    const config = loadConfig(accountName);
    return config[key];
}

// In-memory caches kwa ajili ya ufanisi (Multi-account cache maps)
const configCacheMap = new Map();
const cacheTimeMap = new Map();
const CACHE_TTL = 5000; // sekunde 5

/**
 * Get cached config ya mteja maalum
 */
export function getCachedConfig(accountName) {
    const now = Date.now();
    const cacheKey = accountName || "default_system";
    
    const cachedConfig = configCacheMap.get(cacheKey);
    const cachedTime = cacheTimeMap.get(cacheKey) || 0;

    if (!cachedConfig || (now - cachedTime > CACHE_TTL)) {
        const freshConfig = loadConfig(accountName);
        configCacheMap.set(cacheKey, freshConfig);
        cacheTimeMap.set(cacheKey, now);
        return freshConfig;
    }
    return cachedConfig;
}

/**
 * Invalidate cache ya mteja maalum baada ya mabadiliko
 */
export function invalidateConfigCache(accountName) {
    const cacheKey = accountName || "default_system";
    configCacheMap.delete(cacheKey);
    cacheTimeMap.delete(cacheKey);
}

export const AUTH_INFO_PATH = AUTH_DIR;
