const { Server } = require('socket.io');
const logger = require('./logger');
const getMAC = require('./getMAC');
const { saveInCache } = require('./cache.services');
const ip = require('ip');
const eventEmitter = require('./events');

let io;

async function initSocket(server) {
    io = new Server(server);

    io.on('connection', (socket) => {
        getMAC().then(async macAddress => {
            socket.emit('macAddress', macAddress);
            await saveInCache({ key: "mac_address", value: macAddress });
            eventEmitter.emit('getProfileData');
        }).catch(error => {
            socket.emit('macAddress', 'خطأ عند البحث عن العنوان');
        });

        const ipAddress = ip.address();
        socket.emit('ipAddress', ipAddress);

        socket.on('disconnect', () => {
            console.log('Client disconnected');
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
    io.emit('log', log);
});

function emitLog(log) {
    if (io) {
        io.emit('log', log);
    }
}

module.exports = { initSocket, emitLog, emitCustom };
