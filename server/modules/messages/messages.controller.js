const service = require('./messages.service.js')
const response = require('../../utils/responses.js')
const { saveInCache, getValue } = require('../../utils/cache.services')
const logger = require('../../utils/logger.js')
const { isWhatsappConnected } = require('../../utils/whatssapp.service.js')
const { appendToFileIfNotExists, whatsappFilePath, smsFilePath } = require('../../utils/whatsapp_failed.js');

var hasSentWarningToUserWhatsappAboutQr = false;

const SendSms = async (req, res) => {

    var title = req.query.title
    var body = req.query.body

    try {
        const canUseSms = await getValue({ key: 'can_use_sms' })


        var token = await getValue({ key: 'onesignal_token' })

        if (!token) {
            logger.logError('تم حفظ معلومات الرسالة سيتم محاولة إعادة إرسالها مره أخرى')
            appendToFileIfNotExists(smsFilePath, title, body);
            return response(res, 200, { success: true })
        }

        const docId = await getValue({ key: "doc_id" })

        if (!docId) {
            logger.logError('تم حفظ معلومات الرسالة سيتم محاولة إعادة إرسالها مره أخرى')

            appendToFileIfNotExists(whatsappFilePath, receipt, msg);
            return response(res, 200, { success: true })
        }


        if (canUseSms) {
            logger.logInfo('يتم إرسال رساله نصية إلى الرقم ' + title + '\nالنص المكتوب :' + body)
            const result = await service.SendSms({ title: title, body: body, token: token })
            const resultBody = result.body

            if (resultBody.success) {
                logger.logSuccess('تم إرسال الرسالة النصية بنجاح!')
                return response(res, 200, { success: true })
            } else {

                if (resultBody.data) {
                    logger.logError('فشلت عملية إرسال الرسالة النصية ' + resultBody.data)

                    appendToFileIfNotExists(smsFilePath, title, body);
                    return response(res, 200, { success: true })
                    //    return response(res, 500, resultBody.data)
                } else {
                    logger.logError('فشلت عملية إرسال الرسالة النصية ')

                    appendToFileIfNotExists(smsFilePath, title, body);
                    return response(res, 200, { success: true })
                    //  return response(res, 500, 'فشلت عملية إرسال الرسالة النصية ')
                }
            }

        } else {
            logger.logError('لايمكنك إستخدام خدمة إرسال الرسائل النصية لأنك غير مشترك في الخدمة.')
            return response(res, 500, 'غير مشترك في الخدمه')
        }
    } catch (error) {
        logger.logError('حدث خطأ عند إرسال الرسالة النصية ' + error.message)

        appendToFileIfNotExists(smsFilePath, title, body);
        return response(res, 200, { success: true })
        //  return response(res, 500, error.message)
    }
}

const SendWhatsApp = async (req, res) => {
    var receipt = req.query.receipt
    var msg = req.query.msg

    try {
        const cnaUseWhatsapp = await getValue({ key: 'can_use_whatsapp' })
        logger.logInfo('يتم إرسال رساله واتساب إلى الرقم ' + receipt + '\nالنص المكتوب :' + msg)

        const docId = await getValue({ key: "doc_id" })

        if (!docId) {
            logger.logError('تم حفظ معلومات الرسالة سيتم محاولة إعادة إرسالها مره أخرى')

            appendToFileIfNotExists(whatsappFilePath, receipt, msg);
            return response(res, 200, { success: true })
        }

        if (cnaUseWhatsapp) {

            if (!isWhatsappConnected()) {
                logger.logError('تم حفظ معلومات الرسالة سيتم محاولة إعادة إرسالها مره أخرى')

                if (hasSentWarningToUserWhatsappAboutQr == false) {
                    const docId = await getValue({ key: "doc_id" })

                    logger.logInfo('يتم إرسال تنبيه للمستخدم')
                    const result = await service.SendWhatsAppWarning({ docId: docId })

                    if (result.status) {
                        logger.logSuccess('تم إرسال التنبيه للمستخدم بنجاح')
                        hasSentWarningToUserWhatsappAboutQr = true;
                    } else {
                        logger.logError(result.data)
                    }
                }

                appendToFileIfNotExists(whatsappFilePath, receipt, msg);
                return response(res, 200, { success: true })
            }

            const result = await service.SendWhatsApp({ receipt: receipt, msg: msg })

            if (result.success) {
                logger.logSuccess('تم إرسال الرسالة بنجاح!')
                return response(res, 200, { success: true })
            } else {
                logger.logError('فشلت عملية إرسال رسالة الواتساب  ' + result.data)

                appendToFileIfNotExists(whatsappFilePath, receipt, msg);
                return response(res, 200, { success: true })
            }

        } else {
            logger.logError('لايمكنك إستخدام خدمة إرسال رسائل الواتساب لأنك غير مشترك في الخدمة.')
            return response(res, 500, 'غير مشترك في الخدمه')
        }

    } catch (error) {
        logger.logError('حدث خطأ عند إرسال رسالة الواتساب ' + error.message)
        logger.logError('تم حفظ معلومات الرسالة سيتم محاولة إعادة إرسالها مره أخرى')

        appendToFileIfNotExists(whatsappFilePath, receipt, msg);
        return response(res, 200, { success: true })
    }
}

module.exports = { SendSms, SendWhatsApp }