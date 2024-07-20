const { exec } = require('child_process');
const { execFile } = require('child_process');


// Function to check if Nginx is running
function checkNginxStatus() {
    exec('tasklist /FI "IMAGENAME eq nginx.exe"', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error checking Nginx status: ${stderr}`);
            startNgnix()
        }

        // Check if nginx.exe is in the task list
        if (stdout.includes('nginx.exe')) {
            console.log('Nginx is running.');
        } else {
            console.log('Nginx is not running.');
            startNgnix()
        }
    });
}

// Path to the batch file (assuming it's in the same folder)
const BATCH_FILE_PATH = 'C:\\Users\\baxco\\Downloads\\nginx-1.26.1\\nginx-1.26.1\\startNginx.bat';

function startNgnix() {
    execFile(BATCH_FILE_PATH, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing batch file: ${stderr}`);
            return;
        }
        console.log(`Batch file output: ${stdout}`);
    });
    
}

// Export the function to be used in the batch script
checkNginxStatus()