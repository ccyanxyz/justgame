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

var contractJson = JSON.parse(fs.readFileSync('./contract/abi.json', 'utf8'));
fly.config.baseURL = "https://apilist.tronscan.org"

async function getExpiration(account) {
	var tronWeb = new TronWeb(
		fullNode,
		solidityNode,
		eventServer,
		account.privateKey,
	);
	var addr = account.address;
	var mode = account.mode;
	var timeThresh = account.timeLeft;
	let flag = true;
	try {
		await tronWeb.trx.getBalance().then(ret => {
			console.log(account.address + "->" + ret/1000000);
		}).catch(err => {
			console.log("get balance error:", err);
		})
	} catch (err) {
		console.log("caught err:", err);
	}
}

accounts.forEach(getExpiration);
