const cron = require('node-cron');
const ip = require('ip');
const { saveInCache, getValue } = require('./cache.services');
const logger = require('./logger')
const { executePost } = require('./request.utils')
const eventEmitter = require('./events');


async function checkIpAddress() {

    const isRegisterd = await getValue({ key: 'is_registerd' })

    if (isRegisterd) {
        const currentIp = ip.address();
        const savedIp = await getValue({ key: 'local_ip' });

        if (currentIp !== savedIp) {
            // Add any additional logic here if the IP address has changed
            const params = { currentIp: currentIp }
            await executePost("http://localhost:65531/api/v1/auth/update-ip", params)
        } else {
            logger.logInfo('عنوان الاي بي لم يتغير')
        }
    }
}

// Define the cron job without starting it immediately
let scheduledTask = cron.schedule('* * * * *', () => {

    checkIpAddress().catch(err => {
        logger.logError('حدث خطأ عند البحث عن اي بي الشبكة ' + err)
    });

}, {
    scheduled: false // This option prevents the cron job from starting immediately
});


eventEmitter.on('runIpChecker', async () => {
    try {
        if (scheduledTask) {
            scheduledTask.start();
        }
    } catch (error) {
        logger.logError('فشل عند حفظ عنوان الأي بي ' + error.message);
    }
});
