const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const log = require("pino")();
const { Boom } = require("@hapi/boom");
const qrcode = require("qrcode");
const logger = require('./logger')
const fs = require('fs').promises;

let sock;
let qrDinamic;
let soket;

async function deleteSessionFolder() {
    try {
        await fs.rm("session_auth_info", { recursive: true, force: true });
        logger.logError('تم حذف بيانات الإتصال بالواتساب')
    } catch (err) {
        logger.logError('حصلت مشكلة عند حذف إتصال الواتس اب ' + err)
    }
}

async function connectToWhatsApp() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState("session_auth_info");
        sock = makeWASocket({
            printQRInTerminal: false,
            auth: state,
            logger: log.child({ level: "silent" })
        });

        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect, qr } = update;
            qrDinamic = qr;

            if (connection === "close") {
                let reason = new Boom(lastDisconnect.error).output.statusCode;
                logger.logError(`تم غلق الإتصال بالواتساب بسبب ${reason}`)
                await handleDisconnect(reason);
            } else if (connection === "open") {
                logger.logSuccess('الإتصال بخدمة الواتساب متاح')
            }
        });

        sock.ev.on("creds.update", saveCreds);
    } catch (err) {
        logger.logError(`خطأ غير متوقع عند الإتصال بالواتس اب ${err}`)
    }
}

async function handleDisconnect(reason) {
    if (reason === DisconnectReason.badSession) {
        logger.logError('ملفات جلسة الواتس ليست سليمة. يتم حذف المجلد الان.')
        await deleteSessionFolder();
        sock.logout();
    } else if (reason === DisconnectReason.connectionClosed) {
        logger.logInfo('يتم إعادة الإتصال بخدمة الواتساب حالياً')
        connectToWhatsApp();
    } else if (reason === DisconnectReason.connectionLost) {
        logger.logInfo('يتم إعادة الإتصال بخدمة الواتساب حالياً بسبب فقدان الإتصال')
        connectToWhatsApp();
    } else if (reason === DisconnectReason.connectionReplaced) {
        logger.logInfo('تسجيل الخروج من الواتساب بسبب تغيير الإتصال')
        sock.logout();
    } else if (reason === DisconnectReason.loggedOut) {
        logger.logInfo('تم تسجيل الخروج وحذف المجلد الرجاء مسح رمز الباركود مره أخرى')
        await deleteSessionFolder();
        sock.logout();
    } else if (reason === DisconnectReason.restartRequired) {
        logger.logInfo('يتم إعادة تشغيل خدمة الواتساب')
        connectToWhatsApp();
    } else if (reason === DisconnectReason.timedOut) {
        logger.logInfo('إعادة الإتصال بخدمة الواتساب بسبب فشل العمليه السابقه')
        connectToWhatsApp();
    } else {
        logger.logError(`قطع الإتصال لسبب غير معروف : ${reason}`)
        sock.end(`Unknown disconnect reason: ${reason}`);
    }
}

const isConnected = () => {
    return sock?.user ? true : false;
};

const updateQR = (data) => {
    switch (data) {
        case "qr":
            qrcode.toDataURL(qrDinamic, (err, url) => {
                soket?.emit("qr", url);
                soket?.emit("log", "فم بمسح الباركود");
            });
            break;
        case "connected":
            soket?.emit("qrstatus", "./assets/check.svg");
            soket?.emit("log", "حساب الواتس متصل بنجاح");
            const { id, name } = sock?.user;
            var userinfo = id + " " + name;
            soket?.emit("user", userinfo);

            break;
        case "loading":
            soket?.emit("qrstatus", "./assets/loader.gif");
            soket?.emit("log", "جاري البحث ...");

            break;
        default:
            break;
    }
};

const initializeWhatsappService = () => {
    connectToWhatsApp().catch((err) => {
        logger.logError(`خطأ غير معروف عند تهيئة الإتصال بالواتساب : ${err}`)
    });
};

const updateQrs = (socket) => {
    soket = socket;

    logger.logSuccess('إتصال الواتساب بخدمة سراج سوف تمت بنجاح')

    if (isConnected()) {
        updateQR("connected");
    } else if (qrDinamic) {
        updateQR("qr");
    }
}



module.exports = { initializeWhatsappService, updateQrs };
