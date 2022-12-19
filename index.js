// Write your answer here
const fs = require('fs');
const axios = require('axios');
const products = [];

const parseCSV = ( data ) => {
    let rows = data.split(/\r\n/);
    rows.splice(0, 1);
    rows.pop();
    return rows;
}

fs.readFile('./data/transactions.csv', 'utf8', async function(err, data) {
    // Parse string to array
    let rows = parseCSV(data);
    rows.map((line) => {
        products.push(line.split(','));
    })

    // Get tokens
    let tokens = [...new Set(products.map(product => product[2]))];
    let portfolios = tokens.map(async (token) => {
        let sum = 0;
        let tokenPrice = await axios.get(`https://min-api.cryptocompare.com/data/price?fsym=${token}&tsyms=USD`);
        tokenPrice = tokenPrice.data.USD;
        products.forEach((product, idx) => {
            if( product[2] === token ){
                sum += product[1] === 'DEPOSIT' ? parseFloat( product[3]) : -1*parseFloat( product[3]);
            }
        })
        return sum / tokenPrice + " " + token;
    })
    Promise.all(portfolios).then(res => console.log(res))
})