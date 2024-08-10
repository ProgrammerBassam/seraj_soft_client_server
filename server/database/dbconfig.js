const { saveInCache, getValue } = require('../utils/cache.services')


async function getConfig() {
    const username = await getValue({ key: 'oracle_username' })
    const password = await getValue({ key: 'oracle_password' })
    const oracleIp = await getValue({ key: 'doc_id' }) == "zV47v0fBCHl2MxcKxYcF" ? "http://192.168.0.114" : "127.0.0.1"
    const oraclePort = await getValue({ key: 'doc_id' }) == "zV47v0fBCHl2MxcKxYcF" ? "49160" : "1521"
    const oracleBranch = await getValue({ key: 'oracle_branch' })

    const connectString = oracleIp + ':' + oraclePort + '/' + oracleBranch

    console.log(connectString)

    return {
        user: username,
        password: password,
        connectString: connectString
    }
}


module.exports = { getConfig }