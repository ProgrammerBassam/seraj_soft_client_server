const os = require('os');
const network = require('network');
const { exec } = require('child_process');
const { Buffer } = require('buffer');


function getMAC() {
    return new Promise((resolve, reject) => {
        network.get_interfaces_list((err, interfaces) => {
            if (err) {
                return reject(err);
            }

            let macAddresses = [];

            if (os.platform() === 'win32') {
                exec('getmac /fo csv /nh', (err, stdout) => {
                    if (err) {
                        return reject(err);
                    }

                    macAddresses = stdout
                        .split('\n')
                        .map(line => line.split(',')[0].replace(/"/g, '').trim())
                        .filter(mac => mac.length > 0);

                    const macString = macAddresses[0];
                    console.log(macString)
                    
                    const encodedString = Buffer.from(macString).toString('base64');
                    resolve(encodedString);
                });
            } else {
                macAddresses = interfaces
                    .map(iface => iface.mac)
                    .filter(mac => mac && mac !== '00:00:00:00:00:00');

                const macString = macAddresses[0];
                console.log(macString)

                const encodedString = Buffer.from(macString).toString('base64');
                resolve(encodedString);
            }
        });
    });
}

module.exports = getMAC;
