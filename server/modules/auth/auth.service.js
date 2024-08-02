const { executePost } = require('../../utils/request.utils')
const { saveInCache, getValue } = require('../../utils/cache.services')
const { currentVersion } = require('../../utils/variables_globale')

const GetClientData = async () => {
    try {

        const macAddress = await getValue({ key: "mac_address" })

        const params = { client_code: macAddress }
        const result = await executePost("http://212.38.94.227:3005/api/v1/server", params)
        return result.body

    } catch (error) {
        throw error
    }
}

const UpdateIpAddress = async ({ currentIp }) => {
    try {

        const localIp = currentIp
        const docId = await getValue({ key: "doc_id" })

        const params = { local_ip: localIp, doc_id: docId }
        const result = await executePost("http://212.38.94.227:3005/api/v1/server/update-ip", params)
        return result.body

    } catch (error) {
        throw error
    }
}

const GetFeatures = async () => {
    try {

        const serverVersion = currentVersion

        const params = { server_version: serverVersion }
        const result = await executePost("http://212.38.94.227:3005/api/v1/server/get-features", params)
        return result.body

    } catch (error) {
        throw error
    }
}


module.exports = { GetClientData, UpdateIpAddress, GetFeatures }