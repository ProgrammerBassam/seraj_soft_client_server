const path = require('path');

module.exports = {
    input: './server/server.js', // نقطة الدخول لتطبيقك
    output: './dist/seraj_soft_client_server',
    output: './dist/seraj_soft_client_server.exe', // مسار الملف التنفيذي الناتج
    //  target: 'mac-x64-20.14.0',
    target: 'windows-x64-20.14.0', // الهدف النظامي والإصدار
    resources: [
        './public/**/*' // تضمين جميع الملفات في مجلد public
    ],
    build: true, // بناء الملف التنفيذي
    loglevel: 'info' // مستوى تسجيل المعلومات
};
