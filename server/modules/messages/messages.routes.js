const express = require('express')
const messagesRouter = express.Router()

const ctrl = require('./messages.controller')

messagesRouter.get('/sms', ctrl.SendSms)
messagesRouter.get('/whatsapp', ctrl.SendWhatsApp)

module.exports = messagesRouter