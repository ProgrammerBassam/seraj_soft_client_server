const express = require('express')
const authRouter = express.Router()

const ctrl = require('./auth.controller')

authRouter.post('/client-data', ctrl.GetClientData)
authRouter.post('/update-ip', ctrl.UpdateIpAddress)

module.exports = authRouter