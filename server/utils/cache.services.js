const { createCache, } = require("cache-manager")

let memoryCache = null

function initMemoryCache() {
    memoryCache = createCache({
        max: 100,
        ttl: 1 * 24 * 60 * 60 * 1000,
    });
}

async function saveInCache({ key, value }) {

    if (memoryCache) {
        await memoryCache.set(key, value);
    } else {
        console.error("Memory cache is not initialized");
    }
}

async function getValue({ key }) {
    if (memoryCache) {
        return await memoryCache.get(key);
    } else {
        console.error("Memory cache is not initialized");
    }
}

async function resetInCache({ key, value }) {
    if (memoryCache) {
        await memoryCache.set(key, value);
    } else {
        console.error("Memory cache is not initialized");
    }
}


module.exports = { saveInCache, getValue }
initMemoryCache()
