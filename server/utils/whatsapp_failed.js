const fs = require('fs');
const path = require('path');
const { app } = require('electron'); // Assuming you're using Electron

const dataDirectory = path.join(app.getPath('userData'), 'myAppData');
const whatsappFilePath = path.join(dataDirectory, 'failed_whatsapp.txt');
const smsFilePath = path.join(dataDirectory, 'failed_sms.txt');

// Function to check if the file exists, and create it if not
function ensureFileExists(filePath, callback) {
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // File does not exist, create it
            fs.writeFile(filePath, '', (err) => {
                if (err) {
                    console.error('Error creating file:', err);
                } else {
                    console.log('File created.');
                }
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
        if (err) {
            if (err.code === 'ENOENT') {
                // File doesn't exist
                callback(false);
            } else {
                console.error('Error reading file:', err);
                callback(false);
            }
        } else {
            const lines = data.split(/\r?\n/); // Handle both \n and \r\n line endings
            const escapedLineToCheck = lineToCheck.replace(/\|/g, '\\|'); // Escape pipe characters
            const exists = lines.some(line => line.replace(/\|/g, '\\|') === escapedLineToCheck);
            callback(exists);
        }
    });
}

// Function to append a line to the file if it doesn't exist
function appendToFileIfNotExists(filePath, receipt, msg) {
    ensureFileExists(filePath, () => {
        const escapedMsg = msg.replace(/\|/g, '\\|'); // Escape pipe characters
        const lineToCheck = `${receipt}|${escapedMsg}`;
        fileContainsLine(filePath, lineToCheck, (exists) => {
            if (!exists) {
                const line = `${lineToCheck}\n`;
                fs.appendFile(filePath, line, (err) => {
                    if (err) {
                        console.error('Error appending to file:', err);
                    } else {
                        console.log('Line appended to file!');
                    }
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
                console.error('Error reading file:', err);
                callback([]);
            }
        } else {
            const lines = data.split(/\r?\n/); // Handle both \n and \r\n line endings
            const list = lines.map(line => {
                const [receipt, ...msgParts] = line.split('|');
                const msg = msgParts.join('|').replace(/\\\|/g, '|'); // Unescape pipe characters
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
