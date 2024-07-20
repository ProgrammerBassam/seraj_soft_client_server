const { saveInCache, getValue } = require('../utils/cache.services')
const response = require('../utils/responses')


async function authentication(req, res, next) {

    try {
        const auth_username = await getValue({ key: "auth_username" })
        const auth_password = await getValue({ key: "auth_password" })

        const canUseApi = await getValue({ key: 'can_use_api' })

        const authheader = req.headers.authorization;

        if (!canUseApi) {
            return response(res, 401, 'ليس لديك الصلاحية!')
        }

        if (!authheader) {
            return response(res, 401, 'ليس لديك الصلاحية!')
        }

        const auth = new Buffer.from(authheader.split(' ')[1],
            'base64').toString().split(':');
        const user = auth[0];
        const pass = auth[1];

        if (user == auth_username && pass == auth_password) {
            next()
        } else {
            return response(res, 401, 'ليس لديك الصلاحية!')
        }
    } catch (er) {
        return response(res, 401, 'ليس لديك الصلاحية!')
    }

}

module.exports = { authentication }