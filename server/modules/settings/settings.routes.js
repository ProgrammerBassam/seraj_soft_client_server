const express = require('express')
const settingsRouter = express.Router()

const ctrl = require('./settings.controller')

settingsRouter.get('/get-key', ctrl.GetMacAddress)

module.exports = settingsRouter