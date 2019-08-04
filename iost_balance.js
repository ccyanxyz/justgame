const fs = require('fs')
const bs58 = require('bs58')
const IOST = require('iost');

const rpc = new IOST.RPC(new IOST.HTTPProvider("http://api.iost.io"));

let iost = new IOST.IOST({
	gasRatio: 1,
	gasLimit: 500000,
	delay: 0,
}, new IOST.HTTPProvider('http://api.iost.io'));

let config1 = JSON.parse(fs.readFileSync('./iost.json'), 'utf8');
let config2 = JSON.parse(fs.readFileSync('./iost2.json'), 'utf8');
let config3 = JSON.parse(fs.readFileSync('./iost3.json'), 'utf8');

let accounts = [];

config1.accounts.forEach(acc => {
	accounts.push(acc.account);
})

config2.accounts.forEach(acc => {
	accounts.push(acc.account);
})

config3.accounts.forEach(acc => {
	accounts.push(acc.account);
})

async function getBalance(acc) {
	await rpc.blockchain.getBalance(acc, "iost").then(ret => {
		console.log(acc + "->", ret.balance);
	}).catch(err => {
		console.log(err);
	});
}

accounts.forEach(getBalance);
