const response = require('../../utils/responses.js')
const service = require('./checking.service.js')
const logger = require('../../utils/logger.js')

const CheckLocal = async (req, res) => {
    logger.logInfo('فحص الإتصال بالشبكة المحلية')
    try {

        await service.CheckLocal()
        logger.logSuccess('تم الإتصال بالشبكة المحلية بنجاح!')
        return response(res, 200, { success: true })

    } catch (error) {
        logger.logError('خطأ عند الإتصال بالشبكة المحلية ' + error.message)
        return response(res, 500, error.message)
    }
}

const CheckGlobal = async (req, res) => {
    try {
        logger.logInfo('فحص الإتصال بشبكة الإنترنت')

        const { requestId } = req.query

        await service.CheckGlobal()
        logger.logSuccess('تم الإتصال بشبكة الإنترنت بنجاح!')
        return res.status(200).json({ requestId: requestId, responseData: true })

    } catch (error) {
        logger.logError('خطأ عند الإتصال بشبكة الإنترنت ' + error.message)
        return response(res, 500, error.message)
    }
}

module.exports = { CheckLocal, CheckGlobal }