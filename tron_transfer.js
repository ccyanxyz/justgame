var fs = require('fs')
var TronWeb = require('tronweb')
var fly = require('flyio')
var HttpProvider = TronWeb.providers.HttpProvider;

let config1 = JSON.parse(fs.readFileSync('./tron.json'), 'utf8');
let config2 = JSON.parse(fs.readFileSync('./tron2.json'), 'utf8');
let node = "https://api.trongrid.io";
let accounts = config1.accounts;
let contractAddress = config1.contractAddress;

config2.accounts.forEach(acc => {
	accounts.push(acc);
});

var fullNode = new HttpProvider(node);
var solidityNode = new HttpProvider(node)
var eventServer = node;
var acc = accounts[0];
accounts.shift();

var tronWeb = new TronWeb(
	fullNode,
	solidityNode,
	eventServer,
	acc.privateKey,
);

async function getExpiration(account) {

	try {
		await tronWeb.trx.getBalance(account.address).then(ret => {
			//console.log(account.address + "->" + ret/1000000);
			if(ret/1000000 < 100) {
				console.log("transfer 50 trx to " + account.address);
				tronWeb.trx.sendTransaction(account.address, 50 * 1000000).then(ret => {
					console.log(ret);
				});
			}
		}).catch(err => {
			console.log("get balance error:", err);
		})
	} catch (err) {
		console.log("caught err:", err);
	}
}

accounts.forEach(getExpiration);
