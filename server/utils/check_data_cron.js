const cron = require('node-cron');
const { saveInCache, getValue } = require('./cache.services');
const eventEmitter = require('./events');

// Schedule the cron job to run every hour
cron.schedule('*/2 * * * *', async () => {

    const docId = await getValue({ key: "doc_id" })

    if (!docId) {
        eventEmitter.emit('getProfileData');
    }
});