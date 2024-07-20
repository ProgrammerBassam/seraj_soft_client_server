const express = require('express')

const { authentication } = require('../middlewares/auth.middleware')
const authRouter = require('../modules/auth/auth.routes')
const messagesRouter = require('../modules/messages/messages.routes')
const oracleRouter = require('../modules/oracle/oracle.routes')
const checkingRouter = require('../modules/checking/checking.routes')
const settingsRouter = require('../modules/settings/settings.routes')

const router = express.Router()

router.use('/auth', authRouter)
router.use('/messages', messagesRouter)
router.use('/check', authentication, checkingRouter)
router.use('/settings', settingsRouter)
router.use('/oracle', authentication, oracleRouter)


module.exports = router