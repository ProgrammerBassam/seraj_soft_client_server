const service = require('./oracle.service.js')
const response = require('../../utils/responses.js')
const logger = require('../../utils/logger.js')

const SearchChartAcc = async (req, res) => {

    const { requestId } = req.query
    const { query } = req.body

    try {
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
        if (requestId) {
            return response(res, 500, { requestId: requestId, responseData: error.message })
        } else {
            return response(res, 500, error.message)
        }

    }
}

const GetReportByAccNo = async (req, res) => {

    const { requestId } = req.query
    const { acc_no, start_date, end_date } = req.body


    try {



        const result = await service.GetReportByAccNo({ acc_no, start_date, end_date })
        if (requestId) {
            return res.status(200).json({ requestId: requestId, responseData: result })
        } else {
            return response(res, 200, result)
        }


    } catch (error) {
        if (requestId) {
            return response(res, 500, { requestId: requestId, responseData: error.message })
        } else {
            return response(res, 500, error.message)
        }
    }
}

// Sales
const GetAllSales = async (req, res) => {

    const { requestId } = req.query
    const { account_no, bill_type, start_date, end_date } = req.body

    try {
        const result = await service.GetAllSales({ account_no, bill_type, start_date, end_date })
        if (requestId) {
            return res.status(200).json({ requestId: requestId, responseData: result })
        } else {
            return response(res, 200, result)
        }


    } catch (error) {
        if (requestId) {
            return response(res, 500, { requestId: requestId, responseData: error.message })
        } else {
            return response(res, 500, error.message)
        }
    }
}

// Get All Sales Accounts
const GetAllSalesAccounts = async (req, res) => {
    const { requestId } = req.query
    const { currency_no } = req.body

    try {
        const result = await service.GetAllSalesAccounts({ currency_no })
        if (requestId) {
            return res.status(200).json({ requestId: requestId, responseData: result })
        } else {
            return response(res, 200, result)
        }


    } catch (error) {
        if (requestId) {
            return response(res, 500, { requestId: requestId, responseData: error.message })
        } else {
            return response(res, 500, error.message)
        }
    }
}

// Get Sale Bill
const GetSaleBill = async (req, res) => {
    const { requestId } = req.query
    const { sale_bill_id, year } = req.body

    try {
        const result = await service.GetSaleBill({ sale_bill_id, year })
        if (requestId) {
            return res.status(200).json({ requestId: requestId, responseData: result })
        } else {
            return response(res, 200, result)
        }


    } catch (error) {
        if (requestId) {
            return response(res, 500, { requestId: requestId, responseData: error.message })
        } else {
            return response(res, 500, error.message)
        }
    }
}

// Currencies
const GetCurrencies = async (req, res) => {

    const { requestId } = req.query

    try {
        const result = await service.GetCurrencies()
        if (requestId) {
            return res.status(200).json({ requestId: requestId, responseData: result })
        } else {
            return response(res, 200, result)
        }


    } catch (error) {
        if (requestId) {
            return response(res, 500, { requestId: requestId, responseData: error.message })
        } else {
            return response(res, 500, error.message)
        }
    }
}

module.exports = { SearchChartAcc, GetReportByAccNo, GetAllSales, GetAllSalesAccounts, GetCurrencies, GetSaleBill }