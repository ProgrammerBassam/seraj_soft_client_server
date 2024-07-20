const express = require('express')
const oracleRouter = express.Router()

const ctrl = require('./oracle.controller')

oracleRouter.post('/search-chart-accs', ctrl.SearchChartAcc)
oracleRouter.post('/get-report-by-account-no', ctrl.GetReportByAccNo)

module.exports = oracleRouter