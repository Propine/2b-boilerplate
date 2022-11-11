// Write your answer here
const axios = require("axios");
const DATA_SET_URL =
  "https://raw.githubusercontent.com/Propine/2b-boilerplate/master/data/transactions.csv";
const CRYPTO_COMPARE_URL = "https://min-api.cryptocompare.com/data/price";

const getLastesPortfolio = async () => {
  try {
    const { data: dataSet } = await axios.get(DATA_SET_URL);

    const latestPortfolio = dataSet
      .split("\n")
      .slice(1)
      .reduce((prev, curr) => {
        const [curTimeStamp, curTranType, curToken, curAmount] =
          curr.split(",");
        const [prevTimeStamp] = prev;
        if (new Date(prevTimeStamp) < new Date(curTimeStamp) || !prevTimeStamp)
          return [curTimeStamp, curToken, curAmount];
        else return [...prev];
      }, []);
    const [timeStamp, token, amount] = latestPortfolio;
    const {
      data: { USD: usdRate },
    } = await axios.get(CRYPTO_COMPARE_URL, {
      params: { fsym: token, tsyms: "USD" },
    });
    return `${token} ${usdRate * Number(amount)}`;
  } catch (err) {
    console.error(err);
  }
};

getLastesPortfolio().then((res) => console.log(res));
