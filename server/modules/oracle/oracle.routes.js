const express = require('express')
const oracleRouter = express.Router()

const ctrl = require('./oracle.controller')

oracleRouter.post('/search-chart-accs', ctrl.SearchChartAcc)
oracleRouter.post('/get-report-by-account-no', ctrl.GetReportByAccNo)

oracleRouter.post('/get-sales-accounts', ctrl.GetAllSalesAccounts)
oracleRouter.post('/get-all-sales', ctrl.GetAllSales)
oracleRouter.post('/get-sale-bill', ctrl.GetSaleBill)

oracleRouter.post('/get-currencies', ctrl.GetCurrencies)

module.exports = oracleRouter