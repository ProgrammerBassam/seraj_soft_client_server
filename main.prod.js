const { app, BrowserWindow, autoUpdater, dialog } = require('electron');
const path = require('path');
const log = require('electron-log');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    const startUrl = "http://localhost:65531";
    mainWindow.loadURL(startUrl);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Check for updates
    autoUpdater.checkForUpdatesAndNotify();
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

autoUpdater.on('update-available', () => {
    log.info('Update available.');
    dialog.showMessageBox({
        type: 'info',
        title: 'Update available',
        message: 'A new version is available. Downloading now...',
        buttons: ['OK']
    });
});

autoUpdater.on('update-downloaded', () => {
    log.info('Update downloaded.');
    dialog.showMessageBox({
        type: 'info',
        title: 'Update ready',
        message: 'A new version is ready. Restart now?',
        buttons: ['Yes', 'Later']
    }).then(result => {
        if (result.response === 0) {
            autoUpdater.quitAndInstall(false, true);
        }
    });
});

autoUpdater.on('error', (error) => {
    log.error('Error in auto-updater:', error);
});
