const fs = require('fs');
const whatsappFilePath = 'failed_whatsapp.txt';
const smsFilePath = 'failed_sms.txt';

// Function to check if the file exists, and create it if not
function ensureFileExists(filePath, callback) {
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // File does not exist, create it
            fs.writeFile(filePath, '', (err) => {
                if (err) throw err;
                console.log('File created.');
                callback();
            });
        } else {
            // File exists
            callback();
        }
    });
}

// Function to check if the file contains the specific line
function fileContainsLine(filePath, lineToCheck, callback) {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err && err.code === 'ENOENT') {
            // File doesn't exist
            callback(false);
        } else if (err) {
            throw err;
        } else {
            const lines = data.trim().split('\n');
            const exists = lines.includes(lineToCheck);
            callback(exists);
        }
    });
}

// Function to append a line to the file if it doesn't exist
function appendToFileIfNotExists(filePath, receipt, msg) {
    ensureFileExists(filePath, () => {
        const lineToCheck = `${receipt},${msg}`;
        fileContainsLine(filePath, lineToCheck, (exists) => {
            if (!exists) {
                const line = `${lineToCheck}\n`;
                fs.appendFile(filePath, line, (err) => {
                    if (err) throw err;
                    console.log('Line appended to file!');
                });
            } else {
                console.log('Line already exists in file.');
            }
        });
    });
}

// Function to read the file and parse it into a list
function readFileToList(filePath, callback) {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // File doesn't exist
                console.log('File does not exist.');
                callback([]);
            } else {
                throw err;
            }
        } else {
            const lines = data.trim().split('\n');
            const list = lines.map(line => {
                const [receipt, msg] = line.split(',');
                return { receipt, msg };
            });

            // Remove the file after reading its contents
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) {
                    console.error('Error deleting file:', unlinkErr);
                } else {
                    console.log('File successfully deleted.');
                }
            });


            callback(list);
        }
    });
}



module.exports = {
    appendToFileIfNotExists,
    readFileToList,
    whatsappFilePath,
    smsFilePath
};
