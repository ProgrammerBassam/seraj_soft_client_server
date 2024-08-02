const https = require('https');
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const { exec } = require('child_process');
const os = require('os');

const updateUrl = 'https://yourserver.com/update.zip'; // Replace with your update URL
const tempDir = os.tmpdir(); // Temporary directory
const tempZipPath = path.join(tempDir, 'update.zip');
const appDir = path.dirname(process.execPath); // Directory of the current executable

function checkForUpdates() {
    // Make a request to check if there's an update
    https.get(updateUrl, (res) => {
        if (res.statusCode === 200) {
            // Download the update if it exists
            downloadUpdate();
        }
    }).on('error', (err) => {
        console.error('Error checking for updates:', err.message);
    });
}

function downloadUpdate() {
    const file = fs.createWriteStream(tempZipPath);
    https.get(updateUrl, (res) => {
        res.pipe(file);
        file.on('finish', () => {
            file.close(() => {
                console.log('Update downloaded.');
                applyUpdate();
            });
        });
    }).on('error', (err) => {
        console.error('Error downloading update:', err.message);
    });
}

function applyUpdate() {
    // Extract the update
    fs.createReadStream(tempZipPath)
        .pipe(unzipper.Extract({ path: tempDir }))
        .on('close', () => {
            console.log('Update extracted.');
            replaceFiles();
        });
}

function replaceFiles() {
    // Stop the current app, delete the old files and replace them with new ones
    const updateScript = `
        timeout /t 2 /nobreak
        del /f /q "${path.join(appDir, 'server.exe')}"
        rmdir /s /q "${path.join(appDir, 'node_modules')}"
        move /y "${path.join(tempDir, 'server.exe')}" "${appDir}\\server.exe"
        move /y "${path.join(tempDir, 'node_modules')}" "${appDir}\\node_modules"
        start "" "${path.join(appDir, 'server.exe')}"
    `;
    const scriptPath = path.join(tempDir, 'update.bat');
    fs.writeFileSync(scriptPath, updateScript);

    exec(`start "" "${scriptPath}"`, (error) => {
        if (error) {
            console.error('Error applying update:', error.message);
        } else {
            process.exit(); // Exit current process to allow the script to run
        }
    });
}