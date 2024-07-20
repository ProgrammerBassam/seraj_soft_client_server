/*const service = require('./oracle.service.js')
const response = require('../../utils/responses.js')
const logger = require('../../utils/logger.js')

const SearchChartAcc = async (req, res) => {
    try {

        const { requestId } = req.query
        const { query } = req.body

        if (requestId) {
            logger.logInfo('الإستعلام عن كشف الحساب عن طريق الإنترنت')
        } else {
            logger.logInfo('الإستعلام عن كشف الحساب عن طريق الشبكة المحلية')
        }

        const result = await service.SearchChartAcc({ query: query })

        if (requestId) {
            return res.status(200).json({ requestId: requestId, responseData: result })
        } else {
            return response(res, 200, result)
        }

    } catch (error) {
        return response(res, 500, error.message)
    }
}

const GetReportByAccNo = async (req, res) => {
    try {

        const { requestId } = req.query
        const { acc_no, start_date, end_date } = req.body

        const result = await service.GetReportByAccNo({ acc_no, start_date, end_date })
        if (requestId) {
            return res.status(200).json({ requestId: requestId, responseData: result })
        } else {
            return response(res, 200, result)
        }


    } catch (error) {
        return response(res, 500, error.message)
    }
}

module.exports = { SearchChartAcc, GetReportByAccNo }*/