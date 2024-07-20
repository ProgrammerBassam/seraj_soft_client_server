const speedTest = require('speedtest-net');
const logger = require('./logger')
const eventEmitter = require('./events');

async function testInternetSpeed() {

    try {
        const result = await speedTest({ acceptLicense: true, acceptGdpr: true });

        const downloadSpeed = result.download.bandwidth / 125000; // Convert to Mbps
        const uploadSpeed = result.upload.bandwidth / 125000; // Convert to Mbps
        const ping = result.ping.latency;

        evaluateInternetQuality(downloadSpeed, uploadSpeed, ping);
    } catch (error) {
        logger.logError('خطأ عند فحص سرعة التحميل : ' + error)
    }
}

function evaluateInternetQuality(downloadSpeed, uploadSpeed, ping) {

    if (downloadSpeed > 50) {
        eventEmitter.emit('emitCustom', { key: 'internetStatus', value: 'ممتاز' });
    } else if (downloadSpeed > 20) {
        eventEmitter.emit('emitCustom', { key: 'internetStatus', value: 'جيد' });
    } else if (downloadSpeed > 10) {
        eventEmitter.emit('emitCustom', { key: 'internetStatus', value: 'معقول' });
    } else {
        eventEmitter.emit('emitCustom', { key: 'internetStatus', value: 'ضعيف' });
    }

    if (uploadSpeed > 10) {
        uploadRating = 'Excellent';
    } else if (uploadSpeed > 5) {
        uploadRating = 'Good';
    } else if (uploadSpeed > 2) {
        uploadRating = 'Fair';
    } else {
        uploadRating = 'Poor';
    }

    if (ping < 20) {
        pingRating = 'Excellent';
    } else if (ping < 50) {
        pingRating = 'Good';
    } else if (ping < 100) {
        pingRating = 'Fair';
    } else {
        pingRating = 'Poor';
    }
}

testInternetSpeed();
