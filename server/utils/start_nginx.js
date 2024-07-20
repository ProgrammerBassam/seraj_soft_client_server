const { exec } = require('child_process');
const open = require('open');
const PORT = 65531; // Replace with your actual port if different

// Function to check if Nginx is running
function checkNginxStatus(callback) {
    exec('tasklist /FI "IMAGENAME eq nginx.exe"', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error checking Nginx status: ${stderr}`);
            callback(false);
            return;
        }

        // Check if nginx.exe is in the task list
        if (stdout.includes('nginx.exe')) {
            console.log('Nginx is running.');
            callback(true);
        } else {
            console.log('Nginx is not running.');
            callback(false);
        }
    });
}

// Function to start Nginx
function startNginx() {
    exec('start "" "C:\\path\\to\\nginx.exe"', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error starting Nginx: ${stderr}`);
            open(`http://localhost:${PORT}`);
        } else {
            checkNginxStatus((isRunning) => {
                if (isRunning) {
                    open('http://seraj-soft.com');
                } else {
                    open(`http://localhost:${PORT}`);
                }
            });
        }
    });
}


checkNginxStatus((isRunning) => {
    if (!isRunning) {
        // Start Nginx if it is not running
        startNginx();
    }
});
