const { sendMessage } = require('../../utils/whatssapp.service')
const { executePost } = require('../../utils/request.utils')
const logger = require('../../utils/logger.js')



const SendSms = async ({ title, body, token }) => {
    try {

        const params = {
            token: token,
            title: title,
            body: body
        }

        const result = await executePost("http://212.38.94.227:3005/api/v1/messages/sms", params)
        return result

    } catch (error) {
        logger.logError('حدث خطأ عند إرسال الرسالة النصية ' + error.message)
        throw error
    }
}

const SendWhatsApp = async ({ receipt, msg }) => {
    try {

        const result = await sendMessage(receipt, msg)
        return result

    } catch (error) {
        logger.logError('حدث خطأ عند إرسال رسالة الواتساب ' + error.message)
        throw error
    }
}

const SendWhatsAppWarning = async ({ docId }) => {
    try {

        const params = { docId: docId, message: "يجب إدخال الباركود لبرنامج سراج سوفت للتمكن من إرسال رسائل الواتساب لعملائك وشكراً" }
        const result = await executePost("http://212.38.94.227:3005/api/v1/server/send-whatsapp", params)
        return result.body

    } catch (error) {
        logger.logError('حدث خطأ عند إرسال تنبيه للمستخدم' + error.message)
        throw error
    }
}


module.exports = { SendSms, SendWhatsApp, SendWhatsAppWarning }