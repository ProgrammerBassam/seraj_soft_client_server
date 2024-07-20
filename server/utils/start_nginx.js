const { exec } = require('child_process');
const open = require('open');
const PORT = 65531; // Replace with your actual port if different

function checkNginxStatus(callback) {
    exec('systemctl is-active nginx', (error, stdout) => {
        if (error) {
            console.error('Error checking Nginx status:', error);
            callback(false);
            return;
        }
        callback(stdout.trim() === 'active');
    });
}

function startNginx() {
    exec('sudo systemctl start nginx', (error) => {
        if (error) {
            console.error('Error starting Nginx:', error);
            // Fallback: Open the local server if Nginx fails to start
            open(`http://localhost:${PORT}`);
        } else {
            // Check if Nginx is successfully started and open the correct URL
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
    } else {
        // If Nginx is running, open the desired URL
        open('http://seraj-soft.com');
    }
});
