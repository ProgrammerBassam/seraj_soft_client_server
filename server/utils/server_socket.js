const superagent = require('superagent');
const { getValue, saveInCache } = require('../utils/cache.services');
const { io } = require('socket.io-client');
const eventEmitter = require('./events');
const logger = require('./logger')

let socketServerUrl = null;
let hostToLive = null;
let macAddress = null;
let pageRequest = null;
let pageResponse = null;
let socket = null;

eventEmitter.on('initServerSocket', async () => {
    try {
        if (isSocketConnectedOrNotNull() == false) {
            socketServerUrl = await getValue({ key: "server_ip" });
            hostToLive = "http://127.0.0.1:65531";
            macAddress = await getValue({ key: "encrypt_mac_address" });
            pageRequest = "page-request";
            pageResponse = "page-response";

            openSocket();
        } else {
            eventEmitter.emit('emitCustom', { key: 'isConnectedToServer', value: 'نعم' });
        }

    } catch (error) {
        logger.logError('حدث خطأ عن الإتصال بالسيرفر الخاص بسراج سوفت الرجاء إعادة تحميل الصفحة ' + error)
    }
})

const errorHandler = (handler) => {
    const handleError = (err) => {
        logger.logError('حدث خطأ مع سرفرات سراج سوفت' + err)
    };

    return (...args) => {
        try {
            const ret = handler.apply(this, args);
            if (ret && typeof ret.catch === "function") {
                ret.catch(handleError);
            }
        } catch (e) {
            handleError(e);
        }
    };
};

function executePost(url, params, headers, requestId) {
    superagent
        .post(url)
        .query({ requestId: requestId })
        .set({ authorization: headers, accept: 'application/json', 'content-type': 'application/json' })
        .send(params)
        .end((err, response) => {
            if (err) {
                logger.logError('حدث خطأ مع الإستعلام مع سراج سوفت' + err)
                socket?.emit(pageResponse, err);
            } else {
                socket?.emit(pageResponse, response.body);
            }
        });
}

// Function to check if the socket is connected or not null
function isSocketConnectedOrNotNull() {
    if (socket === null) {
        return false;
    } else if (socket.connected) {
        return true;
    } else {
        return false;
    }
}


function openSocket() {


    socket = io(socketServerUrl, {
        transports: ['polling', 'websocket'],
        maxHttpBufferSize: 100000000,
        query: { userId: macAddress }
    });


    socket.on('connect', () => {

        eventEmitter.emit('emitCustom', { key: 'isConnectedToServer', value: 'نعم' });
        logger.logSuccess('تم الإتصال بنجاح مع سرفرات سراج سوفت')

        const engine = socket.io.engine;

        engine.once("upgrade", () => {
            // called when the transport is upgraded (i.e. from HTTP long-polling to WebSocket)
            //     console.log(engine.transport.name); // in most cases, prints "websocket"
            //   console.log("upgrade")
        });

        engine.on("packet", ({ type, data }) => {
            // called for each packet received
            //    console.log("packet " + type)
            //   console.log("packet " + data)
        });

        engine.on("packetCreate", ({ type, data }) => {
            //    console.log("packetCreate " + type)
            //   console.log("packetCreate " + data)
        });

        engine.on("drain", () => {
            // called when the write buffer is drained
            //  console.log("drain")
        });

        engine.on("close", (reason) => {
            // called when the underlying connection is closed
            logger.logError('تم قطع الإتصال مع سرفرات سراج سوفت بسبب ' + reason)
            eventEmitter.emit('emitCustom', { key: 'isConnectedToServer', value: 'لا' });

            socket.io.opts.query = { userId: macAddress }
        });
    });


    socket.on('disconnect', (reason) => {
        socket.io.opts.query = { userId: macAddress }
        logger.logError('تم قطع الإتصال مع سرفرات سراج سوفت بسبب ' + reason)
        eventEmitter.emit('emitCustom', { key: 'isConnectedToServer', value: 'لا' });
        if (reason === 'io server disconnect') {
            socket.connect()
        }
    });

    socket.on('connect_timeout', () => {
        socket.io.opts.query = { userId: macAddress }
        logger.logError('الإتصال تم قطعه بسبب تجاوز الوقت المحدد')
        eventEmitter.emit('emitCustom', { key: 'isConnectedToServer', value: 'لا' });
    });

    socket.on('reconnect_attempt', () => {
        logger.logInfo(`محاولة إعادة الإتصال مع سرفر سراج سوفت (المحاولة  ${attemptNumber} ...)`)
        eventEmitter.emit('emitCustom', { key: 'isConnectedToServer', value: 'لا' });
        socket.io.opts.query = { userId: macAddress }
    });

    socket.on('reconnect', () => {
        logger.logInfo('إعادة الإتصال مع سرفرات سراج')
        eventEmitter.emit('emitCustom', { key: 'isConnectedToServer', value: 'لا' });

        socket.io.opts.query = { userId: macAddress }
    });

    socket.on('reconnect_attempt', (attempt) => {
        logger.logInfo(`محاولة إعادة الإتصال مع سرفر سراج سوفت (المحاولة  ${attempt} ...)`)
        eventEmitter.emit('emitCustom', { key: 'isConnectedToServer', value: 'لا' });
        socket.io.opts.query = { userId: macAddress }
    });

    socket.on('reconnect_error', (error) => {
        socket.io.opts.query = { userId: macAddress }
        eventEmitter.emit('emitCustom', { key: 'isConnectedToServer', value: 'لا' });
        if (!socket.active) {
            console.error('خطأ عند محاولة الإتصال مع سرفرات سراج ' + error.message);
        }
    });

    socket.on('reconnect_failed', () => {
        socket.io.opts.query = { userId: macAddress }
        console.error('تجاوز عدد المرات المسموح بها للإتصال بسرفرات سراج');
        eventEmitter.emit('emitCustom', { key: 'isConnectedToServer', value: 'لا' });
    });

    socket.on("connect_error", (err) => {
        console.error('خطأ عند محاولة الإتصال مع سرفرات سراج ' + err.message);
        eventEmitter.emit('emitCustom', { key: 'isConnectedToServer', value: 'لا' });
        socket.io.opts.query = { userId: macAddress }
    });

    socket.on(pageRequest, errorHandler((data) => {
        userState = data; // Save the current request to user state
        const { pathname: path, method, params, headers, requestId } = data;
        const localhostUrl = hostToLive + path;

        if (method === "get") {
            executeGet(localhostUrl, params);
        } else if (method === "post") {
            executePost(localhostUrl, params, headers, requestId);
        }
    }));
}