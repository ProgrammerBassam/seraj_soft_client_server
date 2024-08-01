const express = require('express')
const oracleRouter = express.Router()

const ctrl = require('./oracle.controller')

oracleRouter.post('/search-chart-accs', ctrl.SearchChartAcc)
oracleRouter.post('/get-report-by-account-no', ctrl.GetReportByAccNo)

oracleRouter.post('/get-sales-accounts', ctrl.GetAllSalesAccounts)
oracleRouter.post('/get-all-sales', ctrl.GetAllSales)

oracleRouter.get('/get-currencies', ctrl.GetCurrencies)

module.exports = oracleRouter