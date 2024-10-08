const cron = require('node-cron');
const logger = require('./logger');
const eventEmitter = require('./events');
const { readFileToList, whatsappFilePath } = require('./whatsapp_failed');
const { executeGet } = require('./request.utils');
const { isWhatsappConnected } = require('./whatssapp.service')

let isTaskRunning = false;

// Define a function to validate the receipt
function isValidReceipt(receipt) {
    // Ensure receipt is a string and matches the criteria
    return typeof receipt === 'string' && /^7\d{0,8}$/.test(receipt);
}

// Define the cron job without starting it immediately
let scheduledTask = cron.schedule('*/1 * * * *', () => {

    if (isWhatsappConnected()) {
        readFileToList(whatsappFilePath, async (list) => {
            if (list.length > 0) {
                for (const item of list) {

                    const receipt = item['receipt']
                    const msg = item['msg']

                    if (isValidReceipt(receipt)) {
                        await executeGet("http://localhost:65531/api/v1/messages/whatsapp?receipt=" + receipt + "&msg=" + msg)
                        await new Promise(resolve => setTimeout(resolve, 10000));
                    }
                }
            }
        });
    } else {
        logger.logError("يجب إدخال الباركود لبرنامج سراج سوفت للتمكن من إرسال رسائل الواتساب لعملائك وشكراً")
    }

}, {
    scheduled: false // This option prevents the cron job from starting immediately
});


eventEmitter.on('runWhatsappCron', async () => {

    try {
        if (isTaskRunning) {
            return;
        }

        isTaskRunning = true;
        
        if (scheduledTask) {
            scheduledTask.start();
            logger.logInfo('بدء تشغيل فاحص رسائل الواتساب الفاشلة');
        }
    } catch (error) {
        logger.logError('فشل عند بدأ كرون فحص رسائل الواتساب الفاشلة' + error.message);
    }
});