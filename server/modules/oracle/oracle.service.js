const oracledb = require('oracledb')
const iconv = require('iconv-lite')
const { getConfig } = require('../../database/dbconfig')
const { saveInCache, getValue } = require('../../utils/cache.services')
const logger = require('../../utils/logger.js')
const Sentry = require('@sentry/node')

let oracleClientInitialized = false;

const initializeOracleClient = async () => {
    if (!oracleClientInitialized) {
        const litDir = await getValue({ key: 'oracle_lib_dir' });
        oracledb.initOracleClient({ libDir: litDir });
        oracleClientInitialized = true;
    }
};

// Helper function to create a timeout promise
const createTimeoutPromise = (timeout, message) => {
    return new Promise((_, reject) => {
        setTimeout(() => reject(new Error(message)), timeout);
    });
};

const SearchChartAcc = async ({ query }) => {
    await initializeOracleClient();

    let connection;
    let result = [];

    try {
        // Convert the query string from ISO-8859-1 to Windows-1256
        const encodedBytes = iconv.encode(query, 'windows-1256');
        const decodedString = iconv.decode(encodedBytes, 'ISO-8859-1');

        // Timeout for getting the connection
        const getConnectionTimeout = createTimeoutPromise(10000, 'getConnection timed out');
        connection = await Promise.race([
            oracledb.getConnection(await getConfig()),
            getConnectionTimeout,
        ]);

        // Timeout for the execute method
        const executeTimeout = createTimeoutPromise(15000, 'execute timed out');
        // Corrected SQL query
        const checkSql = `SELECT ACC_NO, ACC_NAME FROM ACCOUNTS.CHART_ACC`;
        // const checkSql = `SELECT ACC_NO, ACC_NAME FROM ACCOUNTS.CHART_ACC WHERE ACC_NAME LIKE '%'||:ACC_NAME_VAR||'%'`;
        const checkBinds = {};
        // const checkBinds = { ACC_NAME_VAR: decodedString };
        const options = { outFormat: oracledb.OUT_FORMAT_OBJECT };
        const checkResult = await Promise.race([
            connection.execute(checkSql, checkBinds, options),
            executeTimeout,
        ]);

        // Convert the encoding of the result rows
        result = checkResult.rows.map((row) => {
            // Assuming ACC_NAME is the field to encode/decode
            const encodedBytes = iconv.encode(row.ACC_NAME, 'ISO-8859-1');
            const decodedString = iconv.decode(encodedBytes, 'windows-1256');
            return { ...row, ACC_NAME: decodedString };
        });
    } catch (err) {
        logger.logError('حصل  1 خطأ عن جلب بيانات كشف حساب العملاء ' + err)
        Sentry.captureMessage(err)
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                logger.logError('حصل 2 خطأ عن جلب بيانات كشف حساب العملاء ' + err)
                Sentry.captureMessage(err)
            }
        }
    }

    return result;
};

const GetReportByAccNo = async ({ acc_no, start_date, end_date }) => {
    await initializeOracleClient();

    let connection;
    let result = { entries: [], sum_before: 0.0, currency: {} };

    try {
        // Timeout for getting the connection
        const getConnectionTimeout = createTimeoutPromise(15000, 'getConnection timed out');
        connection = await Promise.race([
            oracledb.getConnection(await getConfig()),
            getConnectionTimeout,
        ]);

        // Fetch data in pages
        let offset = 0;
        const pageSize = 300; // Adjust page size as needed
        let hasMoreData = true;

        while (hasMoreData) {
            const checkSql = `
            SELECT * FROM (
                SELECT ACCOUNTS.CHART_ACC.ACC_NO,
                       ACCOUNTS.CHART_ACC.ACC_NAME,
                       ACCOUNTS.ENTRY_MAIN.ENTRY_NO,
                       ACCOUNTS.ENTRY_MAIN.ENTRY_DATE,
                       ACCOUNTS.ENTRY_MAIN.DETAILS,
                       ACCOUNTS.ENTRY_SUB.SEQ,
                       ACCOUNTS.ENTRY_SUB.ENTRY_MNT,
                       ACCOUNTS.ENTRY_SUB.SUB_DETAILS,
                       ROWNUM rnum
                  FROM ACCOUNTS.CHART_ACC,
                       ACCOUNTS.ENTRY_MAIN,
                       ACCOUNTS.ENTRY_SUB
                 WHERE ACCOUNTS.ENTRY_SUB.ACC_NO = ACCOUNTS.CHART_ACC.ACC_NO
                   AND ACCOUNTS.ENTRY_SUB.ENTRY_NO = ACCOUNTS.ENTRY_MAIN.ENTRY_NO
                   AND ACCOUNTS.CHART_ACC.ACC_NO = :acc_no
                   AND ACCOUNTS.ENTRY_MAIN.ENTRY_DATE BETWEEN TO_DATE(:date1, 'dd-mon-yy') AND TO_DATE(:date2, 'dd-mon-yy')
                 ORDER BY ACCOUNTS.ENTRY_MAIN.ENTRY_DATE ASC,
                          ACCOUNTS.ENTRY_SUB.SEQ ASC
            ) WHERE rnum > :offset AND rnum <= :offset + :pageSize`;

            const checkBinds = { acc_no, date1: start_date, date2: end_date, offset, pageSize };
            const options = { outFormat: oracledb.OUT_FORMAT_OBJECT };

            const checkResult = await connection.execute(checkSql, checkBinds, options);

            // Convert the encoding of the result rows
            const rows = checkResult.rows.map((row) => {
                const encodedAccNameBytes = iconv.encode(row.ACC_NAME, 'ISO-8859-1');
                const decodedAccNameString = iconv.decode(encodedAccNameBytes, 'windows-1256');

                const encodedDetailsBytes = iconv.encode(row.DETAILS, 'ISO-8859-1');
                const decodedDetailsString = iconv.decode(encodedDetailsBytes, 'windows-1256');

                return {
                    ...row,
                    ACC_NAME: decodedAccNameString,
                    DETAILS: decodedDetailsString,
                };
            });

            result.entries.push(...rows);
            offset += pageSize;
            hasMoreData = rows.length === pageSize; // If less than pageSize rows are returned, we're done
        }

        // Second query for sum_before
        const checkSql2 = `
        SELECT SUM(ENTRY_MNT) as TOTAL
          FROM ACCOUNTS.ENTRY_MAIN, ACCOUNTS.ENTRY_SUB
         WHERE ENTRY_MAIN.ENTRY_NO = ENTRY_SUB.ENTRY_NO 
           AND ACC_NO = :acc_no
           AND ENTRY_DATE < TO_DATE(:date1, 'dd-mon-yy')`;

        const checkBinds2 = { acc_no, date1: start_date };
        const checkResult2 = await connection.execute(checkSql2, checkBinds2, { outFormat: oracledb.OUT_FORMAT_OBJECT });

        result.sum_before = checkResult2.rows[0]?.TOTAL ?? 0.0;

        const checkSql3 = `
        SELECT CUR_NAME FROM ACCOUNTS.CURRENCY WHERE CUR_NO=SUBSTR(:acc_no, 4, 1)`;

        const checkBinds3 = { acc_no };
        const checkResult3 = await connection.execute(checkSql3, checkBinds3, { outFormat: oracledb.OUT_FORMAT_OBJECT });

        // Convert the encoding of the result rows
        const rows = checkResult3.rows.map((row) => {
            const encodedCurNameBytes = iconv.encode(row.CUR_NAME, 'ISO-8859-1');
            const decodedCurNameString = iconv.decode(encodedCurNameBytes, 'windows-1256');

            return {
                CUR_NAME: decodedCurNameString,
            };
        });

        result.currency = rows[0]['CUR_NAME'] ?? "يمني";
    } catch (err) {
        logger.logError('حصل  1 خطأ عن جلب بيانات كشف حساب العميل ' + err)
        Sentry.captureMessage(err)
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                logger.logError('حصل  2 خطأ عن جلب بيانات كشف حساب العميل ' + err)
                Sentry.captureMessage(err)
            }
        }
    }

    return result;
};

const GetAllSales = async ({ account_no, bill_type, start_date, end_date }) => {
    await initializeOracleClient();

    let connection;
    let result = [];

    try {
        // Timeout for getting the connection
        const getConnectionTimeout = createTimeoutPromise(15000, 'getConnection timed out');
        connection = await Promise.race([
            oracledb.getConnection(await getConfig()),
            getConnectionTimeout,
        ]);

        const checkSql = `
        SELECT ACCOUNTS.SALES_BILL.MANUAL_BILL_NO, 
ACCOUNTS.SALES_BILL.BILL_TYPE, ACCOUNTS.CHART_ACC.ACC_NAME, 
ACCOUNTS.SALES_BILL.NET, ACCOUNTS.SALES_BILL.DAT, ACCOUNTS.SALES_BILL.DETAILES, 
ACCOUNTS.SALES_BILL.STORE_NO, ACCOUNTS.SALES_BILL.CUR_NO, ACCOUNTS.SALES_BILL.ACC_NO, 
ACCOUNTS.SALES_BILL.ENTRY_NO, ACCOUNTS.CURRENCY.CUR_NAME
FROM ACCOUNTS.SALES_BILL, 
ACCOUNTS.SALES_DETAILES, ACCOUNTS.CHART_ACC, ACCOUNTS.CURRENCY
WHERE SUBSTR(ACCOUNTS.SALES_BILL.ACC_NO, 4, 1)=ACCOUNTS.CURRENCY.CUR_NO
AND  ((ACCOUNTS.SALES_DETAILES.BILL_NO=ACCOUNTS.SALES_BILL.BILL_NO)
AND (ACCOUNTS.SALES_DETAILES.YEAR=ACCOUNTS.SALES_BILL.YEAR)
AND (ACCOUNTS.SALES_BILL.ACC_NO=ACCOUNTS.CHART_ACC.ACC_NO))
AND ACCOUNTS.SALES_BILL.DAT  BETWEEN TO_DATE(:date1, 'dd-mon-yy') AND TO_DATE(:date2, 'dd-mon-yy')
AND ACCOUNTS.SALES_BILL.BILL_TYPE = :billType
AND ACCOUNTS.SALES_BILL.ACC_NO = :accountNo
ORDER BY ACCOUNTS.SALES_BILL.YEAR DESC ,ACCOUNTS.SALES_BILL.MANUAL_BILL_NO
`;

        const checkBinds = { accountNo: account_no, billType: bill_type, date1: start_date, date2: end_date };
        const options = { outFormat: oracledb.OUT_FORMAT_OBJECT };

        const checkResult = await connection.execute(checkSql, checkBinds, options);

        // Convert the encoding of the result rows
        const rows = checkResult.rows.map((row) => {

            const encodedAccNameBytes = iconv.encode(row.ACC_NAME, 'ISO-8859-1');
            const decodedAccNameString = iconv.decode(encodedAccNameBytes, 'windows-1256');

            const encodedDetailsBytes = iconv.encode(row.DETAILES, 'ISO-8859-1');
            const decodedDetailsString = iconv.decode(encodedDetailsBytes, 'windows-1256');

            const encodedCurNameBytes = iconv.encode(row.CUR_NAME, 'ISO-8859-1');
            const decodedCurNametring = iconv.decode(encodedCurNameBytes, 'windows-1256');


            return {
                ...row,
                ACC_NAME: decodedAccNameString,
                DETAILES: decodedDetailsString,
                CUR_NAME: decodedCurNametring
            };
        });

        result.push(...rows);

    } catch (err) {
        logger.logError('حصل  1 خطأ عن جلب بيانات كشف حساب العميل ' + err)
        Sentry.captureMessage(err)
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                logger.logError('حصل  2 خطأ عن جلب بيانات كشف حساب العميل ' + err)
                Sentry.captureMessage(err)
            }
        }
    }

    return result;
};

const GetAllSalesAccounts = async ({ currency_no }) => {
    await initializeOracleClient();

    let connection;
    let result = [];

    try {
        // Timeout for getting the connection
        const getConnectionTimeout = createTimeoutPromise(15000, 'getConnection timed out');
        connection = await Promise.race([
            oracledb.getConnection(await getConfig()),
            getConnectionTimeout,
        ]);

        const checkSql = `
       SELECT ACCOUNTS.SALES_BILL.ACC_NO, ACCOUNTS.CHART_ACC.ACC_NAME
FROM ACCOUNTS.CHART_ACC, ACCOUNTS.SALES_BILL
WHERE (ACCOUNTS.SALES_BILL.ACC_NO=ACCOUNTS.CHART_ACC.ACC_NO)
AND SUBSTR(ACCOUNTS.SALES_BILL.ACC_NO, 4, 1)=:currencyNo
GROUP BY ACCOUNTS.SALES_BILL.ACC_NO, ACCOUNTS.CHART_ACC.ACC_NAME
`;

        const checkBinds = { currencyNo: currency_no };
        const options = { outFormat: oracledb.OUT_FORMAT_OBJECT };

        const checkResult = await connection.execute(checkSql, checkBinds, options);

        // Convert the encoding of the result rows
        const rows = checkResult.rows.map((row) => {
            const encodedAccNameBytes = iconv.encode(row.ACC_NAME, 'ISO-8859-1');
            const decodedAccNameString = iconv.decode(encodedAccNameBytes, 'windows-1256');

            return {
                ...row,
                ACC_NAME: decodedAccNameString,
            };
        });

        result.push(...rows);

    } catch (err) {
        logger.logError('حصل  1 خطأ عن جلب بيانات كشف حساب العميل ' + err)
        Sentry.captureMessage(err)
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                logger.logError('حصل  2 خطأ عن جلب بيانات كشف حساب العميل ' + err)
                Sentry.captureMessage(err)
            }
        }
    }

    return result;
};

const GetSaleBill = async ({ sale_bill_id, year }) => {
    await initializeOracleClient();

    let connection;
    let result = [];

    try {
        // Timeout for getting the connection
        const getConnectionTimeout = createTimeoutPromise(15000, 'getConnection timed out');
        connection = await Promise.race([
            oracledb.getConnection(await getConfig()),
            getConnectionTimeout,
        ]);

        const checkSql = `
      SELECT ACCOUNTS.SALES_BILL.MANUAL_BILL_NO, TO_CHAR(ACCOUNTS.SALES_BILL.DAT,'DD/MM/YYYY') DAT, 
ACCOUNTS.SALES_BILL.BILL_TYPE, ACCOUNTS.SALES_BILL.ACC_NO, 
ACCOUNTS.CHART_ACC.ACC_NAME, ACCOUNTS.SANFS.SANF_NAME, ACCOUNTS.PARTIAL_SANFS.UNIT_NO, 
ACCOUNTS.UNITS.UNIT_NAME, ACCOUNTS.SALES_BILL.NET, ACCOUNTS.SALES_BILL.DETAILES, 
ACCOUNTS.SALES_BILL.STORE_NO, ACCOUNTS.SALES_BILL.DISCOUNT, ACCOUNTS.SALES_BILL.TOTAL, 
ACCOUNTS.SALES_DETAILES.SANF_PRICE, ACCOUNTS.SALES_DETAILES.QTY, 
ACCOUNTS.SALES_DETAILES.TOTAL SUB_TOTAL, ACCOUNTS.CURRENCY.CUR_NAME
FROM ACCOUNTS.SALES_BILL, ACCOUNTS.SALES_DETAILES, ACCOUNTS.SANFS, ACCOUNTS.UNITS, 
ACCOUNTS.CHART_ACC, ACCOUNTS.PARTIAL_SANFS, ACCOUNTS.CURRENCY
WHERE SUBSTR(ACCOUNTS.SALES_BILL.ACC_NO, 4, 1)=ACCOUNTS.CURRENCY.CUR_NO
 AND  ((ACCOUNTS.SALES_DETAILES.BILL_NO=ACCOUNTS.SALES_BILL.BILL_NO)
 AND (ACCOUNTS.SALES_DETAILES.YEAR=ACCOUNTS.SALES_BILL.YEAR)
 AND (ACCOUNTS.SALES_BILL.ACC_NO=ACCOUNTS.CHART_ACC.ACC_NO)
 AND (ACCOUNTS.SANFS.SANF_NO=ACCOUNTS.SALES_DETAILES.SANF_NO)
 AND (ACCOUNTS.PARTIAL_SANFS.SANF_NO=ACCOUNTS.SANFS.SANF_NO)
 AND (ACCOUNTS.PARTIAL_SANFS.UNIT_NO=ACCOUNTS.UNITS.UNIT_NO)
 AND (ACCOUNTS.PARTIAL_SANFS.CAP=ACCOUNTS.SALES_DETAILES.CAP))
 AND (ACCOUNTS.SALES_BILL.BILL_NO = :bill_no1
 AND ACCOUNTS.SALES_BILL.YEAR = :year1)
 ORDER BY SALES_BILL.BILL_NO, SEQ
`;

        const checkBinds = { year1: year, bill_no1: sale_bill_id };
        const options = { outFormat: oracledb.OUT_FORMAT_OBJECT };

        const checkResult = await connection.execute(checkSql, checkBinds, options);

        // Convert the encoding of the result rows
        const rows = checkResult.rows.map((row) => {
            const encodedAccNameBytes = iconv.encode(row.ACC_NAME, 'ISO-8859-1');
            const decodedAccNameString = iconv.decode(encodedAccNameBytes, 'windows-1256');

            return {
                ...row,
                //   ACC_NAME: decodedAccNameString,
            };
        });

        result.push(...rows);

    } catch (err) {
        logger.logError('حصل  1 خطأ عن جلب بيانات كشف حساب العميل ' + err)
        Sentry.captureMessage(err)
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                logger.logError('حصل  2 خطأ عن جلب بيانات كشف حساب العميل ' + err)
                Sentry.captureMessage(err)
            }
        }
    }

    return result;
};

const GetCurrencies = async () => {
    await initializeOracleClient();

    let connection;
    let result = [];

    try {
        // Timeout for getting the connection
        const getConnectionTimeout = createTimeoutPromise(15000, 'getConnection timed out');
        connection = await Promise.race([
            oracledb.getConnection(await getConfig()),
            getConnectionTimeout,
        ]);

        const checkSql = `
       SELECT CUR_NO, CUR_NAME FROM ACCOUNTS.CURRENCY ORDER BY CUR_NO
`;

        const checkBinds = {};
        const options = { outFormat: oracledb.OUT_FORMAT_OBJECT };

        const checkResult = await connection.execute(checkSql, checkBinds, options);

        // Convert the encoding of the result rows
        const rows = checkResult.rows.map((row) => {
            const encodeCurNameBytes = iconv.encode(row.CUR_NAME, 'ISO-8859-1');
            const decodedCurNameString = iconv.decode(encodeCurNameBytes, 'windows-1256');

            return {
                ...row,
                CUR_NAME: decodedCurNameString,
            };
        });

        result.push(...rows);

    } catch (err) {
        logger.logError('حصل  1 خطأ عن جلب بيانات كشف حساب العميل ' + err)
        Sentry.captureMessage(err)
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                logger.logError('حصل  2 خطأ عن جلب بيانات كشف حساب العميل ' + err)
                Sentry.captureMessage(err)
            }
        }
    }

    return result;
};

module.exports = { SearchChartAcc, GetReportByAccNo, GetAllSales, GetAllSalesAccounts, GetCurrencies, GetSaleBill }