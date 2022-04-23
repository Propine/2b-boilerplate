## Question 1 - Programming
_We're looking at your programming ability. It must not only work, it should be maintainable._

Let us assume you are a crypto investor. You have made transactions over a period of time which is logged in a CSV file at the [data directory](https://raw.githubusercontent.com/Propine/2b-boilerplate/master/data/transactions.csv). Write a command line program that returns the latest portfolio value per token in USD

The program should be ran like this

```
npm run start
```

On running, it should return the latest portfolio value per token in USD

The CSV file has the following columns
 - timestamp: Integer number of seconds since the Epoch
 - transaction_type: Either a DEPOSIT or a WITHDRAWAL
 - token: The token symbol
 - amount: The amount transacted

Portfolio means the balance of the token where you need to add deposits and subtract withdrawals. You may obtain the exchange rates from [cryptocompare](https://min-api.cryptocompare.com/documentation) where the API is free. You should write it in Node.js as our main stack is in Javascript/Typescript and we need to assess your proficiency.


## Submission

Please take no more than 2 hours to finish. We do not track time, hence you can start and end at your own time. Your answers should comprise of the following

  - Source code that you used for deriving the results
  - README that explains various design decisions that you took.

Commit your answers in a private Github repository(it's free), please do not fork as other candidates will see your answers. Add Zan(liangzan), Kyle(kyled7), Thanh(thanhnpp), Viswanath(viswanathkgp12) as collaborators then inform us that it is done at zan@propine.com, kyle.dinh@propine.com, thanh.nguyen@propine.com, viswanath.kapavarapu@propine.com.





""""""Design decision to solve this problem"""""""


1. Parsing the contents of CSV

I have tried both the event driven approach and promise based approach to parse the content of CSV. I have used neat-csvmodule for promise based approach and csv-parsermodule for event driven approach. But, I faced the problem during promise based approach because it can't parse the CSV file of size more than 512MB and in our case size is almost 940MB. So, I decided to use event driven approach as it can parse file of any size because it gets data on chunks.


2. Command Line Program

I have used yargsmodule in this node program as its help in creating our own command-line commands in node.js and makes command-line arguments flexible and easy to use. It seems that we will be having four different types of command to solve this task. Command will be on this format.

1. Command without any arguments
2. Command with token as an argument
3. Command with date as an argument
4. Command with both token and date as an arguments

3. Yargs setup

```
 yargs
  .usage('node $0 [cmd] <options>')
  .command('tokenInfo', 'List the information of the token', yargs => {
    return yargs
      .option({
        token: {
          alias: 't',
          description: 'Enter token name',
          type: 'string',
        },
        date: {
          alias: 'd',
          description: 'Enter date in YYYY-MM-DD format',
          type: 'string',
        },
      })
      .strictOptions()
      .check((arg, options) => {
        arg.command = arg._[0];
        if (arg.hasOwnProperty('token')) {
          if (!arg.token) {
            throw new Error('Enter token name');
          }
        }
        if (arg.hasOwnProperty('date')) {
          if (arg.date) {
            if (isDateValid(arg.date)) {
              let [startTimestamp, endTimestamp] = dateToEpochTime(arg.date);
              arg.startTimestamp = startTimestamp;
              arg.endTimestamp = endTimestamp;
            } else {
              throw new Error('Please enter valid date in YYYY-MM-DD format');
            }
          } else {
            throw new Error('Please enter date');
          }
        }
        return true;
      });
  })
  .strictCommands()
  .check((arg, options) => {
    if (!commandList.includes(arg._[0])) {
      throw new Error('Please enter valid command');
    }
    return true;
  })
  .help()
  .alias('help', 'h').argv;
```
For this purpose, I have created a command tokenInfo, --token and -t options to pass the token name and --date and -d option to pass the date. For now, any others options and beside this will be invalid as we have used strictOptions()and strictCommands(). If we need any other commands or options in the future, we can add it later.

To make the code more manageable, I have used the command approach as we may need multiple command in the future.

If token or date is passed as an arguments on tokenInfo command, we will validate them before passing to the main function.


4. Error Handling on different scenarios


I. If token name is missing

```
node main.js tokenInfo --token
```
If user has enabled the --token option but didn't pass the value of the token name. In this situation, we will validate it with in the check()function and throw an error Please enter token nameand program get terminated.


II. If date is missing

```
node main.js tokenInfo --date

```
If user has enabled the --date option but didn't pass any date. In this situation, we will validate it with in the check()function and throw an error Please enter dateand program get terminated.


III. If invalid date is entered

```
node main.js tokenInfo --date shailesh
```
Date passed by the user get validate inside the check() function. If it is invalid, error is thrown with message Please enter valid dateand program get terminated.


IV. For invalid token name

We console the error given token not found.


V. If there are no transactions on given date

We console the error no any transactions on the given date.


5. Storing cryptocompare api key on the .env file

Cryptocompare url and api key are stored on the .env file as it lets us to customize our individual working environment variables. .env file are not committed in the git so secret credentials will be safe from outside user.


6. isDateValid() function to check whether date is valid or not.

```
const isDateValid = date => {
  return (
    new Date(`${date}T00:00:00`) instanceof Date &&
    !isNaN(new Date(`${date}T00:00:00`).valueOf())
  );
};
```

7. Generating start epoch time and end epoch time for a given date.

For a given date, we need to get it start epoch timestamp and end epoch timestamp as we have only epoch timestamp on the csv file. By default, javascript will return the time in milli second considering the time zone. To convert it into UTC epoch time,timezoneOffset is deducted. startTimestamp and endTimestamp are embedded inside argv.

```
const dateToEpochTime = date => {
  date = new Date(`${date}T00:00:00`);
  let userTimezoneOffset = date.getTimezoneOffset() * 60 * 1000;
  const startTimestamp =
    parseInt(new Date(date.getTime() - userTimezoneOffset).getTime()) / 1000;
  const endTimestamp =
    parseInt(
      new Date(
        date.getTime() + 24 * 60 * 60 * 1000 - userTimezoneOffset,
      ).getTime(),
    ) / 1000;

  return [startTimestamp, endTimestamp];
};
```

8. Getting the balance of token in USD from cryptocompare

I have gone through the cryptocompare API documentation where I found https://min-api.cryptocompare.com/data/priceendpoint need to be used to get the balance of token in USD. I have created free API key to make use of this endpoint in our app which I have stored in .env file. We need to pass three query params in this case fsym, tsyms and api_key. In fsym,we pass the token name, in tsyms we pass the USD as we need to token balance in USD and in api_key we pass the api key that we have created before.


9. Adding command in yargs file.

I have added tokenInfocommand to get the information related to token. In the future, if we need any extra commands on command line program we can add those command on yargs setup and run the respective code when those command are executed with the help of switch...case program. I have list all the available command and validate that command before going to the next step.


10. Globally Available Commands

To make our command available globally,I add a shebang line to the top of main.js:

```
#!/usr/bin/env node
```
Next, bin property is added to our package.json file. This maps the command name (crpyto) to the name of the file to be executed (relative to package.json):

```
"bin": {
"crypto": "./main.js"
}
```
After that, installing this module globally and we have a working shell command.

```
npm install -g
```
Now we can run our command line application using cryptocommand from any directory.

Examples:

```
crypto tokenInfo
```

```
crypto tokenInfo -t BTC
```
