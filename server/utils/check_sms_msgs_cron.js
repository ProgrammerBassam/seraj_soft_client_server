const cron = require('node-cron');
const logger = require('./logger');
const eventEmitter = require('./events');
const { readFileToList, smsFilePath } = require('./whatsapp_failed');
const { executeGet } = require('./request.utils');
const { getValue } = require('./cache.services');


// Define the cron job without starting it immediately
let scheduledTask = cron.schedule('*/10 * * * *', async () => {

    const token = await getValue({ key: 'onesignal_token' })

    if (token) {
        readFileToList(smsFilePath, async (list) => {
            if (list.length > 0) {
                for (const item of list) {

                    const receipt = item['receipt']
                    const msg = item['msg']

                    await executeGet("http://localhost:65531/api/v1/messages/sms?title=" + receipt + "&body=" + msg + "&token=" + token)
                }
            }
        });
    } else {
        logger.logError("يجب التأكد من الإشعارات في الموبايل الخاص بك")
    }

}, {
    scheduled: false // This option prevents the cron job from starting immediately
});


eventEmitter.on('runSmsCron', async () => {
    try {
        if (scheduledTask) {
            scheduledTask.start();
            logger.logInfo('بدء تشغيل فاحص رسائل الإس إم إس الفاشلة');
        }
    } catch (error) {
        logger.logError('فشل عند بدأ كرون فحص رسائل رسائل الإس إم إس  الفاشلة' + error.message);
    }
});