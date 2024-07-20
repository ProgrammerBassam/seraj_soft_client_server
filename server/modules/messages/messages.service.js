// const { sendMessage } = require('../../utils/whatssapp.service')
const { executePost } = require('../../utils/request.utils')

const SendSms = async ({ title, body, token }) => {
    try {

        const params = {
            token: token,
            title: title,
            body: body
        }

        executePost("http://localhost:3005/api/v1/messages/sms", params)

    } catch (error) {
        throw error
    }
}

const SendWhatsApp = async ({ receipt, msg }) => {
    /*   try {
   
           await sendMessage(receipt, msg)
   
       } catch (error) {
           throw error
       } */
}


module.exports = { SendSms, SendWhatsApp }