const response = require('../../utils/responses.js')
const { saveInCache, getValue } = require('../../utils/cache.services')

const GetMacAddress = async (req, res) => {
    try {

        const encMacAddress = await getValue({ key: "mac_address" })
        return response(res, 200, { mac_address: encMacAddress })

    } catch (error) {
        return response(res, 500, error.message)
    }
}

module.exports = { GetMacAddress }