const superagent = require('superagent');
const { getValue, saveInCache } = require('../utils/cache.services');
const { io } = require('socket.io-client');
const eventEmitter = require('./events');
const logger = require('./logger');

let socketServerUrl = null;
let hostToLive = null;
let macAddress = null;
let pageRequest = null;
let pageResponse = null;
let socket = null;

eventEmitter.on('initServerSocket', async () => {
    try {
        if (!isSocketConnectedOrNotNull()) {
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
        logger.logError('حدث خطأ عن الإتصال بالسيرفر الخاص بسراج سوفت الرجاء إعادة تحميل الصفحة ' + error);
    }
});

function isSocketConnectedOrNotNull() {
    return socket !== null && socket.connected;
}

function openSocket() {
    if (socket !== null) {
        socket.disconnect();
    }

    socket = io(socketServerUrl, {
        transports: ['polling', 'websocket'],
        maxHttpBufferSize: 100000000,
        query: { userId: macAddress }
    });

    socket.on('connect', () => {
        eventEmitter.emit('emitCustom', { key: 'isConnectedToServer', value: 'نعم' });
        logger.logSuccess('تم الإتصال بنجاح مع سرفرات سراج سوفت');
    });

    socket.on('disconnect', (reason) => {
        logger.logError('تم قطع الإتصال مع سرفرات سراج سوفت بسبب ' + reason);
        eventEmitter.emit('emitCustom', { key: 'isConnectedToServer', value: 'لا' });
        if (reason === 'io server disconnect') {
            socket.connect();
        }
    });

    socket.on('connect_timeout', () => {
        logger.logError('الإتصال تم قطعه بسبب تجاوز الوقت المحدد');
        eventEmitter.emit('emitCustom', { key: 'isConnectedToServer', value: 'لا' });
    });

    socket.on('reconnect_attempt', (attempt) => {
        logger.logInfo(`محاولة إعادة الإتصال مع سرفر سراج سوفت (المحاولة ${attempt} ...)`);
        eventEmitter.emit('emitCustom', { key: 'isConnectedToServer', value: 'لا' });
    });

    socket.on('reconnect_error', (error) => {
        logger.logError('خطأ عند محاولة الإتصال مع سرفرات سراج ' + error.message);
        eventEmitter.emit('emitCustom', { key: 'isConnectedToServer', value: 'لا' });
    });

    socket.on('reconnect_failed', () => {
        logger.logError('تجاوز عدد المرات المسموح بها للإتصال بسرفرات سراج');
        eventEmitter.emit('emitCustom', { key: 'isConnectedToServer', value: 'لا' });
    });

    socket.on("connect_error", (err) => {
        logger.logError('خطأ عند محاولة الإتصال مع سرفرات سراج ' + err.message);
        eventEmitter.emit('emitCustom', { key: 'isConnectedToServer', value: 'لا' });
    });

    socket.on(pageRequest, errorHandler((data) => {
        const { pathname: path, method, params, headers, requestId } = data;
        const localhostUrl = hostToLive + path;

        if (method === "get") {
            executeGet(localhostUrl, params);
        } else if (method === "post") {
            executePost(localhostUrl, params, headers, requestId);
        }
    }));
}

const errorHandler = (handler) => {
    const handleError = (err) => {
        logger.logError('حدث خطأ مع سرفرات سراج سوفت' + err);
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
                logger.logError('حدث خطأ مع الإستعلام مع سراج سوفت' + err);
                socket?.emit(pageResponse, err);
            } else {
                socket?.emit(pageResponse, response.body);
            }
        });
}