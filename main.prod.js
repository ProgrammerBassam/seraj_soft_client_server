const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
require('./server/server');
const { updateElectronApp } = require('update-electron-app');

// Create a log file path
const logFilePath = path.join(app.getPath('userData'), 'error.log');

// Function to log errors
function logError(error) {
    const errorMsg = `[${new Date().toISOString()}] ${error}\n`;
    fs.appendFileSync(logFilePath, errorMsg, 'utf8');
    console.error(error);  // Optionally, log to console as well
}

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    // Load the start URL
    const startUrl = "http://localhost:65531";
    mainWindow.loadURL(startUrl);

    // Set locale-specific settings if needed
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.executeJavaScript('document.documentElement.lang = "ar";');
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// Catch app-level errors
app.on('error', logError);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logError(`Uncaught Exception: ${error.message}`);
    logError(error.stack);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logError(`Unhandled Rejection: ${reason}`);
});

// Automatically update the app
updateElectronApp();
