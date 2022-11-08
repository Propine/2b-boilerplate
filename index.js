const fs = require('fs');
const jquery_csv = require('jquery-csv');
const axios = require('axios');
var sample = './data/transactions.csv';



fs.readFile(sample, 'UTF-8', async function(err, csv) {
    if (err) {
        console.log(err);
    }

    await jquery_csv.toObjects(csv, {}, async function(err, data) {
        if (err) {
            console.log(err);
        }
        // console.log(data)
        var data_directory = [];

        for (var i = 0, len = data.length; i < len; i++) {
            data_directory.push(data[i]);
        }
        data_directory = data_directory.map(item => {
            return {
                transaction_type: item.transaction_type,
                token: item.token,
                amount: parseFloat(item.amount),
            };
        });

        var unique = [...new Set(data_directory.map(x => x.token))];
        var url_crypto_compare = 'https://min-api.cryptocompare.com/data/pricemulti?fsyms=' + unique.toString() + '&tsyms=USD';

        var crypto_compare = await axios.get(url_crypto_compare)
            .then(async function(response) {
                return response.data;
            });

        var o = {}
        var result = data_directory.reduce(function(r, e) {
            var key = e.transaction_type + '|' + e.token;

            if (!o[key]) {
                o[key] = e;
                r.push(o[key]);
            } else {
                o[key].amount += e.amount;
            }
            return r;
        }, []);

        result_deposit = result.map(item => {
            if (item.transaction_type == "DEPOSIT") {
                var usd = crypto_compare[item.token]["USD"]
                return {
                    token: item.token,
                    us_dollar: parseFloat(item.amount) * usd,
                };
            }
        });

        result_deposit = result_deposit.filter(function(element) {
            return element !== undefined;
        });
        result_withdrawal = result.map(item => {
            if (item.transaction_type == "WITHDRAWAL") {
                var usd = crypto_compare[item.token]["USD"]
                return {
                    token: item.token,
                    us_dollar: parseFloat(item.amount) * usd,
                };
            }
        });
        result_withdrawal = result_withdrawal.filter(function(element) {
            return element !== undefined;
        });

        final_data = []
        result_deposit.forEach(deposit => {
            result_withdrawal.forEach(withdrawal => {
                if (deposit.token == withdrawal.token) {
                    total = deposit.us_dollar - withdrawal.us_dollar;
                    final_data.push({
                        token: deposit.token,
                        portfolio: total.toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'USD'
                        })
                    })
                }
            });
        });

        console.log(final_data)
    });
});