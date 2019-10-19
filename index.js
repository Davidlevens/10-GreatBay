/**
 * @see {@link https://www.npmjs.com/package/promise-mysql}
 */
const mysql = require('promise-mysql');

/**
 * Bring DB config in from separate file
 * to keep logic clean.
 */
const conf = require('./config.js');
const inquirer = require('inquirer');

/**
 * Main entry point to script
 * This is an 'async' function
 * @see {@link https://hackernoon.com/6-reasons-why-javascripts-async-await-blows-promises-away-tutorial-c7ec10518dd9}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await}
 */



async function run() {
  const connection = await mysql.createConnection(conf);

  // await createItem(connection);
  // await createCategory(connection);
  // await updateItem(connection);
  // await readItem(connection);
  const user = await inquirer.prompt([
    {
      type: 'list',
      name: 'whatToDo',
      message: 'What do you want to do?',
      choices: ['POST AN ITEM', 'BID ON AN ITEM'],
    },
  ]);

  if (user.whatToDo==='BID ON AN ITEM') {
    biddingWar(connection);
  } else if (user.whatToDo==='POST AN ITEM') {
    posting(connection);
  }


  // connection.end();
}

run();



// function if they choose to bid. it will ask you what ID do you what to bid on and how much you want to bid. it will rerun if the ID is wrong or bid is to low. then it will update the database with the newest bid
const biddingWar = function(connection) {
  connection.query('SELECT * FROM auctions', function(err, res) {
    if (err) throw err;

    for (let i = 0; i < res.length; i++) {
      console.log('ID: ' +res[i].id + ' | ' + 'Item: ' + res[i].item_name + ' | ' + 'Current Bid: ' + res[i].highest_bid);
      console.log('-----------------------------------');
    }

    inquirer.prompt([
      {
        type: 'input',
        name: 'itemBid',
        message: 'What item do you you want to bid on? (insert ID)',
      },
      {
        type: 'input',
        name: 'bid',
        message: 'How much do you want to bid?',
      },

    ]).then(function(user) {
      let existItem;

      existItem = false;

      for (let i = 0; i < res.length; i++) {
        if (parseInt(res[i].id)===parseInt(user.itemBid)) {
          existItem = true;
        }
      }

      if (!existItem) {
        console.log('**********************************************************');
        console.log('ID is incorrect. Please try again.');
        console.log('**********************************************************');
        biddingWar(connection);
      } else if (res[user.itemBid-1].highest_bid>=user.bid) {
        console.log('**********************************************************');
        console.log('Bid needs to be higher then current bid. Please try again.');
        console.log('**********************************************************');
        biddingWar(connection);
      } else if (res[user.itemBid-1].highest_bid<user.bid) {
        connection.query('UPDATE auctions SET ? WHERE ?', [{
          highest_bid: parseFloat(user.bid)}, {id: user.itemBid}], function(err, res) {
          if (err) throw err;
          console.log('Congrats!! You are the highest bidder');
          connection.end();
        });
      }
    });
  });
};

// consturtor to input items into the DB
function ItemInfo(item, category, startingBid) {
  if (!(this instanceof ItemInfo)) {
    return new ItemInfo(item, category, startingBid);
  }
  this.item_name = item;
  this.category = category;
  this.starting_bid = startingBid;
  this.highest_bid = startingBid;
};

// function to post products to the database
const posting = function(connection) {
  inquirer.prompt([
    {
      type: 'input',
      name: 'item',
      message: 'What item do you want to post?',
    },
    {
      type: 'input',
      name: 'category',
      message: 'What category does your item belong in?',
    },
    {
      type: 'input',
      name: 'startingBid',
      message: 'How much do you want your starting bid to be?',
    },

  ]).then(function(user) {
    const newItem = new ItemInfo(user.item, user.category, user.startingBid);

    connection.query('INSERT INTO auctions SET ?', newItem, function(err, res) {
      if (err) throw err;

      console.log('Congrats!! Your item have been posted.');
    });
    connection.end();
  });
};



