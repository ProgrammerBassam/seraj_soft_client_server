const service = require('./messages.service.js')
const response = require('../../utils/responses.js')
const { saveInCache, getValue } = require('../../utils/cache.services')

const SendSms = async (req, res) => {
    try {

        const canUseSms = await getValue({ key: 'can_use_sms' })

        if (canUseSms) {
            var title = req.query.title
            var body = req.query.body
            var token = await getValue({ key: 'onesignal_token' })

            await service.SendSms({ title: title, body: body, token: token })
            return response(res, 200, { success: true })
        } else {
            return response(res, 500, 'غير مشترك في الخدمه')
        }



    } catch (error) {
        return response(res, 500, error.message)
    }
}

const SendWhatsApp = async (req, res) => {
    /* try {
 
         const canUseWahtsApp = await getValue({ key: 'can_use_whatsapp' })
 
         if (canUseWahtsApp) {
             var receipt = req.query.receipt
             var msg = req.query.msg
 
 
             await service.SendWhatsApp({ receipt: receipt, msg: msg })
             return response(res, 200, { success: true })
         } else {
             return response(res, 500, 'غير مشترك في الخدمه')
         }
 
 
 
     } catch (error) {
         return response(res, 500, error.message)
     }*/
}

module.exports = { SendSms, SendWhatsApp }