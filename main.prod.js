const { app, BrowserWindow } = require('electron');
const path = require('path');
require('./server/server');

const { updateElectronApp } = require('update-electron-app');

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

    // Set the locale to Arabic
    app.setLocale('ar');

    const startUrl = "http://localhost:65531";
    mainWindow.loadURL(startUrl);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

updateElectronApp();
