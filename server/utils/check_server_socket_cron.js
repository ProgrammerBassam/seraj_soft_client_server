const cron = require('node-cron');
const { getValue } = require('./cache.services');
const logger = require('./logger')
const eventEmitter = require('./events');


async function checkServerSocket() {

    const isRegisterd = await getValue({ key: 'is_registerd' })

    if (isRegisterd) {

        const canUseApi = await getValue({ key: 'can_use_api' });

        if (canUseApi) {
            eventEmitter.emit('initServerSocket');
        }
    }
}

// Define the cron job without starting it immediately
let scheduledTask = cron.schedule('*/10 * * * *', () => {

    checkServerSocket().catch(err => {
        logger.logError('خطأ عند فحص الإتصال بالشبكة الخارجية' + err)
    });

}, {
    scheduled: false // This option prevents the cron job from starting immediately
});


eventEmitter.on('runServerSocketChecker', async () => {
    try {
        if (scheduledTask) {
            scheduledTask.start();
        }
    } catch (error) {
        logger.logError('فشل عند حفظ عنوان الأي بي ' + error.message);
    }
});
