const service = require('./messages.service.js')
const response = require('../../utils/responses.js')
const { saveInCache, getValue } = require('../../utils/cache.services')
const logger = require('../../utils/logger.js')

const SendSms = async (req, res) => {
    try {
        const canUseSms = await getValue({ key: 'can_use_sms' })

        var title = req.query.title
        var body = req.query.body
        var token = await getValue({ key: 'onesignal_token' })

        logger.logInfo('يتم إرسال رساله نصية إلى الرقم ' + title + '\nالنص المكتوب :' + body)

        if (canUseSms) {
            const result = await service.SendSms({ title: title, body: body, token: token })

            if (result.success) {
                logger.logSuccess('تم إرسال الرسالة النصية بنجاح!')
                return response(res, 200, { success: true })
            } else {

                if (result.body.data) {
                    logger.logError('فشلت عملية إرسال الرسالة النصية ' + result.body.data)
                    return response(res, 500, result.body.data)
                } else {
                    logger.logError('فشلت عملية إرسال الرسالة النصية ')
                    return response(res, 500, 'فشلت عملية إرسال الرسالة النصية ')
                }
            }

        } else {
            logger.logError('لايمكنك إستخدام خدمة إرسال الرسائل النصية لأنك غير مشترك في الخدمة.')
            return response(res, 500, 'غير مشترك في الخدمه')
        }
    } catch (error) {
        logger.logError('حدث خطأ عند إرسال الرسالة النصية ' + error.message)
        return response(res, 500, error.message)
    }
}

const SendWhatsApp = async (req, res) => {
    try {

        const cnaUseWhatsapp = await getValue({ key: 'can_use_whatsapp' })

        var receipt = req.query.receipt
        var msg = req.query.msg

        logger.logInfo('يتم إرسال رساله واتساب إلى الرقم ' + receipt + '\nالنص المكتوب :' + msg)

        if (cnaUseWhatsapp) {
            const result = await service.SendWhatsApp({ receipt: receipt, msg: msg })

            if (result.success) {
                logger.logSuccess('تم إرسال الرسالة بنجاح!')
                return response(res, 200, { success: true })
            } else {
                logger.logError('فشلت عملية إرسال رسالة الواتساب  ' + result.data)
                return response(res, 500, result.data)
            }

        } else {
            logger.logError('لايمكنك إستخدام خدمة إرسال رسائل الواتساب لأنك غير مشترك في الخدمة.')
            return response(res, 500, 'غير مشترك في الخدمه')
        }

    } catch (error) {
        logger.logError('حدث خطأ عند إرسال رسالة الواتساب ' + error.message)
        return response(res, 500, error.message)
    }
}

module.exports = { SendSms, SendWhatsApp }