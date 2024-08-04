const superagent = require('superagent');
const eventEmitter = require('./events');
const logger = require('./logger')
const { getValue, saveInCache } = require('./cache.services')
const Sentry = require("@sentry/node");

function executeGet(url) {
    return new Promise((resolve, reject) => {
        superagent
            .get(url)
            .end((err, response) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(response);
                }
            });
    });
}


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

        if (await getValue({ key: 'is_registerd' }) == true) {

            const canUserSms = await getValue({ key: 'can_use_sms' })
            const canUseWhatsapp = await getValue({ key: 'can_use_whatsapp' })
            const canUseApi = await getValue({ key: 'can_use_api' })


            eventEmitter.emit('emitCustom', { key: 'smsService', value: canUserSms ? 'مشترك' : 'غير مشترك' });
            eventEmitter.emit('emitCustom', { key: 'whatsappService', value: canUseWhatsapp ? 'مشترك' : 'غير مشترك' });
            eventEmitter.emit('emitCustom', { key: 'apiService', value: canUseApi ? 'مشترك' : 'غير مشترك' });

            if (canUseApi) {
                eventEmitter.emit('initServerSocket');
            }

            return;
        }

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

            const serverIp = clientData['server_ip']
            await saveInCache({ key: "server_ip", value: serverIp ?? "" })

            const localIp = clientData['local_ip']
            await saveInCache({ key: "local_ip", value: localIp ?? "" })

            const encryptMacAddress = clientData['encrypt_mac_address']
            await saveInCache({ key: "encrypt_mac_address", value: encryptMacAddress ?? "" })

            eventEmitter.emit('emitCustom', { key: 'smsService', value: canUserSms ? 'مشترك' : 'غير مشترك' });
            eventEmitter.emit('emitCustom', { key: 'whatsappService', value: canUseWhatsapp ? 'مشترك' : 'غير مشترك' });
            eventEmitter.emit('emitCustom', { key: 'apiService', value: canUseApi ? 'مشترك' : 'غير مشترك' });

            if (canUseApi) {
                eventEmitter.emit('initServerSocket');
                eventEmitter.emit('runIpChecker');
                eventEmitter.emit('runServerSocketChecker');
            }

            if (canUseWhatsapp) {
                eventEmitter.emit('runWhatsappCron');
            }

            if (canUserSms) {
                eventEmitter.emit('runSmsCron');
            }

            await executeGet("http://localhost:65531/api/v1/auth/get-features")

            Sentry.setUser({ docId: clientData.doc_id, id: encryptMacAddress ?? "" });


        } else {
            await saveInCache({ key: 'is_registerd', value: false })
        }

    } catch (error) {
        logger.logError(error.message)
    }
});


module.exports = { executePost, executeGet }