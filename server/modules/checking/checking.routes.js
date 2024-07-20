const express = require('express')
const checkingRouter = express.Router()

const ctrl = require('./checking.controller')

checkingRouter.post('/check-local', ctrl.CheckLocal)
checkingRouter.post('/check-global', ctrl.CheckGlobal)

module.exports = checkingRouter