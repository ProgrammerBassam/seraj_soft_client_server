const superagent = require('superagent');
const { getValue, saveInCache } = require('../utils/cache.services');
const { io } = require('socket.io-client');
const eventEmitter = require('./events');
const logger = require('./logger');

class SocketManager {
    constructor() {
        this.socketServerUrl = null;
        this.hostToLive = null;
        this.macAddress = null;
        this.pageRequest = null;
        this.pageResponse = null;
        this.socket = null;
    }

    async initServerSocket() {
        try {
            if (!this.isSocketConnectedOrNotNull()) {
                this.socketServerUrl = await getValue({ key: "server_ip" });
                this.hostToLive = "http://127.0.0.1:65531"; // Consider making this configurable
                this.macAddress = await getValue({ key: "encrypt_mac_address" });
                this.pageRequest = "page-request";
                this.pageResponse = "page-response";

                this.openSocket();
            } else {
                eventEmitter.emit('emitCustom', { key: 'isConnectedToServer', value: 'نعم' });
            }
        } catch (error) {
            logger.logError('حدث خطأ عن الإتصال بالسيرفر الخاص بسراج سوفت الرجاء إعادة تحميل الصفحة ' + error);
        }
    }

    isSocketConnectedOrNotNull() {
        return this.socket !== null && this.socket.connected;
    }

    openSocket() {
        if (this.socket !== null) {
            this.socket.disconnect();
        }

        this.socket = io(this.socketServerUrl, {
            transports: ['polling', 'websocket'],
            maxHttpBufferSize: 100000000,
            query: { userId: this.macAddress }
        });

        this.socket.on('connect', () => {
            eventEmitter.emit('emitCustom', { key: 'isConnectedToServer', value: 'نعم' });
            logger.logSuccess('تم الإتصال بنجاح مع سرفرات سراج سوفت');
        });

        this.socket.on('disconnect', (reason) => {
            logger.logError('تم قطع الإتصال مع سرفرات سراج سوفت بسبب ' + reason);
            eventEmitter.emit('emitCustom', { key: 'isConnectedToServer', value: 'لا' });
            if (reason === 'io server disconnect') {
                this.socket.connect();
            }
        });

        this.socket.on('connect_timeout', () => {
            logger.logError('الإتصال تم قطعه بسبب تجاوز الوقت المحدد');
            eventEmitter.emit('emitCustom', { key: 'isConnectedToServer', value: 'لا' });
        });

        this.socket.on('reconnect_attempt', (attempt) => {
            logger.logInfo(`محاولة إعادة الإتصال مع سرفر سراج سوفت (المحاولة ${attempt} ...)`);
            eventEmitter.emit('emitCustom', { key: 'isConnectedToServer', value: 'لا' });
        });

        this.socket.on('reconnect_error', (error) => {
            logger.logError('خطأ عند محاولة الإتصال مع سرفرات سراج ' + error.message);
            eventEmitter.emit('emitCustom', { key: 'isConnectedToServer', value: 'لا' });
        });

        this.socket.on('reconnect_failed', () => {
            logger.logError('تجاوز عدد المرات المسموح بها للإتصال بسرفرات سراج');
            eventEmitter.emit('emitCustom', { key: 'isConnectedToServer', value: 'لا' });
        });

        this.socket.on("connect_error", (err) => {
            logger.logError('خطأ عند محاولة الإتصال مع سرفرات سراج ' + err.message);
            eventEmitter.emit('emitCustom', { key: 'isConnectedToServer', value: 'لا' });
        });

        this.socket.on(this.pageRequest, this.errorHandler((data) => {
            const { pathname: path, method, params, headers, requestId } = data;
            const localhostUrl = this.hostToLive + path;

            if (method === "get") {
                this.executeGet(localhostUrl, params);
            } else if (method === "post") {
                this.executePost(localhostUrl, params, headers, requestId);
            }
        }));
    }

    errorHandler(handler) {
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
    }

    executePost(url, params, headers, requestId) {
        superagent
            .post(url)
            .query({ requestId: requestId })
            .set({ authorization: headers, accept: 'application/json', 'content-type': 'application/json' })
            .send(params)
            .end((err, response) => {
                if (err) {
                    logger.logError('حدث خطأ مع الإستعلام مع سراج سوفت' + err);
                    this.socket?.emit(this.pageResponse, err);
                } else {
                    this.socket?.emit(this.pageResponse, response.body);
                }
            });
    }
}

const socketManager = new SocketManager();
eventEmitter.on('initServerSocket', () => socketManager.initServerSocket());