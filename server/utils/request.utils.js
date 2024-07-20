const superagent = require('superagent');
const eventEmitter = require('./events');
const logger = require('./logger')
const { saveInCache } = require('./cache.services')



function executePost(url, params) {
    return new Promise((resolve, reject) => {
        superagent
            .post(url)
            .set({ accept: 'application/json', 'content-type': 'application/json' })
            .send(params)
            .end((err, response) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(response);
                }
            });
    });
}

eventEmitter.on('getProfileData', async () => {
    try {
        const result = await executePost("http://localhost:65531/api/v1/auth/client-data", {})
        const data = result.body.data

        if (data.status) {
            await saveInCache({ key: 'is_registerd', value: true })

            const clientData = data.data

            const auth_username = clientData['auth_username']
            const auth_password = clientData['auth_password']

            await saveInCache({ key: "auth_username", value: auth_username })
            await saveInCache({ key: "auth_password", value: auth_password })

            await saveInCache({ key: "doc_id", value: clientData.doc_id })

            const canUserSms = clientData['can_use_sms']
            await saveInCache({ key: "can_use_sms", value: canUserSms ?? false })

            const canUseWhatsapp = clientData['can_use_whatsapp']
            await saveInCache({ key: "can_use_whatsapp", value: canUseWhatsapp ?? false })

            const canUseApi = clientData['can_use_api']
            await saveInCache({ key: "can_use_api", value: canUseApi ?? false })

            const oracleUsername = clientData['oracle_username']
            await saveInCache({ key: "oracle_username", value: oracleUsername ?? "" })

            const oraclePassword = clientData['oracle_password']
            await saveInCache({ key: "oracle_password", value: oraclePassword ?? "" })

            const oraclePort = clientData['oracle_port']
            await saveInCache({ key: "oracle_port", value: oraclePort ?? "49160" })

            const oracleBranch = clientData['oracle_branch']
            await saveInCache({ key: "oracle_branch", value: oracleBranch ?? "" })

            const oracleLibDir = clientData['oracle_lib_dir']
            await saveInCache({ key: "oracle_lib_dir", value: oracleLibDir ?? "" })

            const onesignalToken = clientData['onesignal_token']
            await saveInCache({ key: "onesignal_token", value: onesignalToken ?? "" })

            await executePost("http://localhost:65531/api/v1/auth/update-ip", {})

            eventEmitter.emit('emitCustom', { key: 'smsService', value: canUserSms ? 'مشترك' : 'غير مشترك' });
            eventEmitter.emit('emitCustom', { key: 'whatsappService', value: canUseWhatsapp ? 'مشترك' : 'غير مشترك' });
            eventEmitter.emit('emitCustom', { key: 'apiService', value: canUseApi ? 'مشترك' : 'غير مشترك' });
        } else {
            await saveInCache({ key: 'is_registerd', value: false })
        }

    } catch (error) {
        logger.logError(error.message)
    }
});


module.exports = { executePost }