const service = require('./auth.service.js')
const response = require('../../utils/responses.js')
const logger = require('../../utils/logger.js')
const eventEmitter = require('../../utils/events');

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

const GetFeatures = async (req, res) => {
    logger.logInfo('جلب بيانات الإصدار الحالي')
    try {
        const result = await service.GetFeatures()

        if (result.status) {
            logger.logSuccess('تم جلب بيانات الإصدار الحالي')

            eventEmitter.emit('emitCustom', { key: 'newFeaturesList', value: result.data.new_features });
            eventEmitter.emit('emitCustom', { key: 'videosList', value: result.data.videos });
        } else {
            logger.logError(result.data)
        }
        return response(res, 200, result)
    } catch (error) {
        logger.logError(error.message)
        return response(res, 500, error.message)
    }
}


module.exports = { GetClientData, UpdateIpAddress, GetFeatures }