// socket.js
const socket = io(); // Initialize the socket connection

// Event listeners for index.html
if (document.getElementById('macAddress')) {
    socket.on('macAddress', (macAddress) => {
        document.getElementById('macAddress').textContent = macAddress;
    });

    socket.on('ipAddress', (ipAddress) => {
        document.getElementById('ipAddress').textContent = ipAddress;
    });

    socket.on('smsService', (smsService) => {
        document.getElementById('smsService').textContent = smsService;
    });

    socket.on('whatsappService', (whatsappService) => {
        document.getElementById('whatsappService').textContent = whatsappService;
        if (whatsappService) {
            document.getElementById('whatsappButton').style.display = 'block';
        } else {
            document.getElementById('whatsappButton').style.display = 'none';
        }
    });

    socket.on('apiService', (apiService) => {
        document.getElementById('apiService').textContent = apiService;
    });

    socket.on('log', (log) => {
        const logSection = document.getElementById('logSection');
        const logMessage = document.createElement('div');
        logMessage.classList.add('log-message');
        if (log.type === 'success') {
            logMessage.classList.add('log-success');
        } else if (log.type === 'error') {
            logMessage.classList.add('log-error');
        } else {
            logMessage.classList.add('log-info');
        }
        logMessage.textContent = log.message;
        logSection.appendChild(logMessage);
        logSection.scrollTop = logSection.scrollHeight;
    });
}



// Event listeners for whatsapp.html
if (document.getElementById('qrcode')) {
    const qrcode = document.getElementById("qrcode");
    const iduser = document.getElementById("iduser");

    socket.on("qr", (url) => {
        qrcode.setAttribute("src", url);
    });

    socket.on("qrstatus", (status) => {
        qrcode.setAttribute("src", status);
    });

    socket.on("user", (user) => {
        iduser.innerHTML = user;
    });

    socket.on('log', (log) => {
        document.getElementById('log').textContent = log;
    });
}
