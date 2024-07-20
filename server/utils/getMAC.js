const { exec } = require('child_process');
const os = require('os');
const Buffer = require('buffer').Buffer;

function getMAC() {
    return new Promise((resolve, reject) => {
        let command;

        if (os.platform() === 'darwin') {
            command = "ifconfig en0 | grep ether | awk '{print $2}'";
        } else if (os.platform() === 'win32') {
            command = 'getmac';
        } else {
            return reject(new Error('Unsupported platform'));
        }

        exec(command, (err, stdout) => {
            if (err) {
                return reject(err);
            }

            // Process stdout based on platform
            let macAddresses;
            if (os.platform() === 'win32') {
                macAddresses = stdout
                    .split('\n')
                    .map(line => line.split(',')[0].replace(/"/g, '').trim())
                    .filter(mac => mac.length > 0);
            } else {
                macAddresses = stdout
                    .split('\n')
                    .map(line => line.trim())
                    .filter(mac => mac.length > 0);
            }

            // Join MAC addresses with "-"
            const macString = macAddresses[0]

            // Encode macString using Base64
            const encodedString = Buffer.from(macString).toString('base64');

            resolve(encodedString);
        });
    });
}

module.exports = getMAC;
