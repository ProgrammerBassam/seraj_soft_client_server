// IMPORTANT: Make sure to import `instrument.js` at the top of your file.
// If you're using ECMAScript Modules (ESM) syntax, use `import "./instrument.js";`
// //"electron-forge start",
require("./instrument.js");

const express = require('express');
const path = require('path');
const http = require('http');
const logger = require('morgan');
const myLogger = require('./utils/logger.js');
const { Server } = require('socket.io');
const helmet = require('helmet');
const timeout = require('connect-timeout');
const cors = require('cors');
const { getValue } = require('./utils/cache.services');
 require('./utils/check_ip_cron');
require('./utils/server_socket.js');
require('./utils/check_data_cron');
require('./utils/check_whatsapp_msgs_cron.js');
require('./utils/check_sms_msgs_cron.js');
const { initializeWhatsappService, updateQrs } = require('./utils/whatssapp.service');
const { initSocket } = require('./utils/local_socket');
const response = require('./utils/responses');
const Sentry = require('@sentry/node');

const app = express();


const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    path: '/whatsapp1',
    transports: ['websocket'],
});

const PORT = 65531;



// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({ origin: "*", methods: 'GET,HEAD,PUT,PATCH,POST,DELETE' }));
app.use(helmet());
app.use(logger('common'));
app.use('/api/v1', timeout('30s'));

// Routes
app.use('/api/v1', require('./routes/routes'));

// Error handling
app.use((err, req, res, next) => {
    if (req.timedout) {
        response(res, 503, 'المعذره تم قطع الإتصال');
    } else {
        next(err);
    }
});

io.of('/whatsapp1').on('connection', (socket) => {
    console.log('A client connected to /whatsapp1');

    updateQrs(socket)
});

// Initialize services
initSocket(server);
initializeWhatsappService();

// Add this after all routes,
// but before any and other error-handling middlewares are defined
Sentry.setupExpressErrorHandler(app);

// General error handling middleware
app.use(async (err, req, res, next) => {

    const clientCode = await getValue({ key: 'mac_address' })

    Sentry.withScope(scope => {
        // Add user info if available
        if (clientCode) {
            scope.setUser({
                id: clientCode,
            });
        }

        // Add request details
        scope.setExtra('request_url', req.originalUrl);
        scope.setExtra('method', req.method);
        scope.setExtra('headers', req.headers);

        // Capture the exception
        Sentry.captureException(err);

        // Send a response
        res.status(500).json({
            message: 'Internal Server Error',
        });
    });
});


/*(async () => {
    const open = (await import('open')).default;

    const PORT = process.env.PORT || 65531;

    server.listen(PORT, async () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        await open(`http://localhost:${PORT}`);
    });
})();*/
server.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    //  await open(`http://localhost:${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        process.exit();
    } else {
        console.error(`Server error: ${err.message}`);
    }
});

// Signal and Exception Handling
process.on('SIGINT', () => {
    console.log('Received SIGINT. Shutting down gracefully...');
    process.exit();
});

process.on('uncaughtException', (err) => {
    myLogger.logError('خطأ غير متوقع ' + err)

    // Capture the exception and send it to Sentry
    Sentry.captureException(err);

    // Optionally, you can delay the process exit to ensure the error is sent to Sentry
    Sentry.flush(2000).then(() => {
        // Do not exit the process to keep the server running
        myLogger.logSuccess('تم إرسال الخطأ إلينا')
    }).catch((flushErr) => {
        console.error('Error in Sentry flush', flushErr);
        myLogger.logError('خطأ غير متوقع عند إرسال الخطأ إلينا ' + flushErr)
        // Continue execution even if flushing to Sentry fails
    });
});

process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
    myLogger.logError('خطأ غير متوقع ' + reason + 'عند ' + promise)


    // Optionally, you can delay the process exit to ensure the error is sent to Sentry
    Sentry.flush(2000).then(() => {
        // Do not exit the process to keep the server running
        myLogger.logSuccess('تم إرسال الخطأ إلينا')
    }).catch((flushErr) => {
        console.error('Error in Sentry flush', flushErr);
        myLogger.logError('خطأ غير متوقع عند إرسال الخطأ إلينا ' + flushErr)
        // Continue execution even if flushing to Sentry fails
    });
});

process.on('rejectionHandled', (promise) => {
    console.log('Rejection Handled at:', promise);
});
