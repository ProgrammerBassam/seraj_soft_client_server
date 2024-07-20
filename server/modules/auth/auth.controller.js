const service = require('./auth.service.js')
const response = require('../../utils/responses.js')
const logger = require('../../utils/logger.js')

const GetClientData = async (req, res) => {
    logger.logInfo('تحديث البيانات')
    try {
        const result = await service.GetClientData()

        if (result.status) {
            logger.logSuccess('تم تحديث بياناتك بنجاح')
        } else {
            logger.logError(result.data)
        }
        return response(res, 200, result)
    } catch (error) {
        logger.logError('خطأ عند تحديث البيانات ' + error.message)
        return response(res, 500, error.message)
    }
}

const UpdateIpAddress = async (req, res) => {
    logger.logInfo('تحديث العنوان الجديد لدينا')
    try {
        const result = await service.UpdateIpAddress()

        if (result.status) {
            logger.logSuccess('تم تحديث عنوان الاي بي الخاص بكم بنجاح')
        } else {
            logger.logError(result.data)
        }
        return response(res, 200, result)
    } catch (error) {
        logger.logError(error.message)
        return response(res, 500, error.message)
    }
}

module.exports = { GetClientData, UpdateIpAddress }