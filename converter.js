const axios = require('axios');
const moment = require('moment');

convertTransactions();

async function convertTransactions() {
    try {
        const transactions = await getTransactions(100);
        const transactionsToProcess = await prepareTranscationData(transactions);
        const resp = await processTransactions(transactionsToProcess);

        console.log(resp.data);
    } catch (ex) {
        console.log('An error occurred loading and processing transcations', ex);
    }
}

async function getTransactions(totalTransactions) {
    const promises = [];

    for (let i = 0; i < totalTransactions; i++) {
        promises.push(axios.get('https://7np770qqk5.execute-api.eu-west-1.amazonaws.com/prod/get-transaction'));
    }

    return await Promise.all(promises);
}

async function processTransactions(transactions) {
    return await axios.post('https://7np770qqk5.execute-api.eu-west-1.amazonaws.com/prod/process-transactions', { transactions });
}

async function prepareTranscationData(transactions) {
    const exchRates = await retrieveExchangeRates();

    const transactionsToProcess = transactions.map(transaction => {
        const { createdAt, currency, amount, checksum } = transaction.data;

        return {
            createdAt,
            currency,
            amount,
            convertedAmount: convertToEuro(amount, exchRates.rates[currency]),
            checksum
        }
    });

    return transactionsToProcess;
}

async function retrieveExchangeRates() {
    const dateFormat = moment().format('YYYY-MM-DD');

    const resp = await axios.get(`https://api.exchangeratesapi.io/${dateFormat}?base=EUR`);
    return resp.data;
}

function convertToEuro(amount, exchRate) {
    const result = amount / exchRate;

    return parseFloat(result.toFixed(4));
}