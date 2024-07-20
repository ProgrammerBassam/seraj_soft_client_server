const EventEmitter = require('events');

class Logger extends EventEmitter {
    logSuccess(message) {
        this.emit('log', { type: 'success', message });
    }

    logError(message) {
        this.emit('log', { type: 'error', message });
    }

    logInfo(message) {
        this.emit('log', { type: 'info', message });
    }
}

module.exports = new Logger();
