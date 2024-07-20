const cron = require('node-cron');
const ip = require('ip');
const { saveInCache, getValue } = require('./cache.services');
const logger = require('./logger')
const { executePost } = require('./request.utils')
const { emitKeyValue } = require('./local_socket')

async function checkIpAddress() {

    const isRegisterd = await getValue({ key: 'is_registerd' })

    if (isRegisterd) {
        const currentIp = ip.address();
        const savedIp = await getValue({ key: 'local_ip' });

        if (currentIp !== savedIp) {
            logger.logInfo(`عنوان الاي بي تغير من ${savedIp} إلى ${currentIp} `);
            await saveInCache({ key: 'local_ip', value: currentIp });

            // Add any additional logic here if the IP address has changed
            await executePost("http://localhost:65531/api/v1/auth/update-ip", {})
        } else {
            logger.logInfo('عنوان الاي بي لم يتغير')
        }
    }
}

// Schedule the cron job to run every hour
cron.schedule('* * * * *', () => {
    checkIpAddress().catch(err => {
        logger.logError('حدث خطأ عند البحث عن اي بي الشبكة ' + err)
    });
});

// Initial call to save the current IP address if not already saved
(async () => {
    try {
        const initialIp = ip.address();
        const savedIp = await getValue({ key: 'local_ip' });

        if (!savedIp) {
            await saveInCache({ key: 'local_ip', value: initialIp });
            logger.logInfo('عنوان الاي بي الخاص بكم هو ' + initialIp);
        }
    } catch (error) {
        logger.logError('فشل عند حفظ عنوان الأي بي ' + error.message);
    }
})();

