const { saveInCache, getValue } = require('../../utils/cache.services')


const CheckLocal = async () => {
    return true
}

const CheckGlobal = async () => {
    return true
}


module.exports = { CheckLocal, CheckGlobal }