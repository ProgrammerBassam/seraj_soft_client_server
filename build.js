const electronInstaller = require('electron-winstaller');

electronInstaller.createWindowsInstaller({
  appDirectory: './out/prod/seraj-soft-server-client-win32-x64',
  outputDirectory: './installer',
  authors: 'SerajSoft',
  exe: 'seraj_soft_client_server.exe',
  setupExe: 'SerajSoftSetup.exe',
  setupIcon: './assets/icon.ico',
  description: 'Seraj Soft API for client-server applications',
  noMsi: false,
  setupOnly: false,
  noMsi: true,
  createDesktopShortcut: true,
  createStartMenuShortcut: true
})
.then(() => console.log('Installer created successfully!'))
.catch((e) => console.log('An error occurred: ', e.message));
