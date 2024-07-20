const { Server } = require('socket.io');
const logger = require('./logger');
const getMAC = require('./getMAC');
const { saveInCache } = require('./cache.services');
const ip = require('ip');
const eventEmitter = require('./events');
const Sentry = require('@sentry/node');

let io;

async function initSocket(server) {
    io = new Server(server);

    io.on('connection', (socket) => {
        getMAC().then(async macAddress => {
            socket.emit('macAddress', macAddress);
            await saveInCache({ key: "mac_address", value: macAddress });
            eventEmitter.emit('getProfileData');
        }).catch(error => {
            logger.logError('خطأ عند البحث عن العنوان ' + error)
            socket.emit('macAddress', 'خطأ عند البحث عن العنوان');
        });

        const ipAddress = ip.address();
        socket.emit('ipAddress', ipAddress);

        socket.on('disconnect', () => {
            logger.logError('تم قطع الإتصال الداخلي')
        });
    });

    eventEmitter.on('emitCustom', ({ key, value }) => {
        if (io) {
            io.emit(key, value);
        }
    });
}

function emitCustom({ key, value }) {
    if (io) {
        io.emit(key, value);
    }
}

// Listen for log events and broadcast them
logger.on('log', (log) => {
    try {
        io.emit('log', log);
    } catch (error) {
        Sentry.withScope(scope => {

            scope.setExtra('route', '/logger.on');
            Sentry.captureException(error);
        });
    }

});

function emitLog(log) {
    if (io) {
        io.emit('log', log);
    }
}

module.exports = { initSocket, emitLog, emitCustom };
