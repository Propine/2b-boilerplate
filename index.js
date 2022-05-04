const fs = require('fs');
const fetch = require('node-fetch');
require('dotenv').config();

const getCurrencyPrice = async (currency) => {
  const defaultCurrency = 'USD';
  const url = `https://min-api.cryptocompare.com/data/price?fsym=${currency}&tsyms=${defaultCurrency}&api_key=${process.env.API_KEY}`;

  const response = await fetch(url);
  try {
    const json = await response.json();
    return parseFloat(json[defaultCurrency]);
  } catch (error) {
    throw Error('Get currency price failed', error);
  }
};

const readBalancesFromData = async (filename) => {
  const readStream = fs.createReadStream(filename);
  const balances = {};
  let chunkLeftover = '';

  const processChunk = (chunk) => {
    let data = chunk.toString();
    if (chunkLeftover.length > 0) {
      data = chunkLeftover + data;
      chunkLeftover = '';
    }

    const lines = data.split('\n');
    const transactions = lines.map((line, i) => {
      // skip csv header
      if (line === 'timestamp,transaction_type,token,amount') return [];
      const [timestamp, action, currency, amount] = line.split(',');

      if (!timestamp || !action || !currency || !amount) {
        // chunk data is not complete transaction, reserve it for next chunk
        if (i === lines.length - 1) {
          chunkLeftover = line;
          return [];
        }
      }

      return [timestamp, action, currency, amount];
    });

    transactions.forEach((transaction) => {
      const [, action, currency, amount] = transaction;
      switch (action) {
        case 'DEPOSIT':
          balances[currency] = (balances[currency] || 0) + parseFloat(amount);
          break;
        case 'WITHDRAWAL':
          balances[currency] = (balances[currency] || 0) - parseFloat(amount);
          break;
      }
    });
  };

  return new Promise(function (resolve, reject) {
    readStream.on('data', processChunk);
    readStream.on('end', () => resolve(balances));
    readStream.on('error', reject);
  });
};

const calculatePortfolio = async (balances) => {
  let total = 0;

  console.log('Portfolio value per tokens:');
  for (const currency in balances) {
    const amount = balances[currency];
    const price = await getCurrencyPrice(currency);
    const value = amount * price;
    total += value;

    console.log(
      `- ${currency}(${amount}): ${value} USD (@${price} USD/${currency})`,
    );
  }

  console.log(`Total value: ${total} USD`);
  return total;
};

async function main() {
  const balances = await readBalancesFromData(
    __dirname + '/data/transactions.csv',
  );

  return calculatePortfolio(balances);
}

main();
