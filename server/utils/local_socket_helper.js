const eventEmitter = require('./events');

function emitKeyValue(key, value) {
    console.log(`emitKeyValue called with key: ${key}, value: ${value}`);
    eventEmitter.emit('emitCustom', { key, value });
}

module.exports = { emitKeyValue };
