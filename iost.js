const fs = require('fs')
const bs58 = require('bs58')
const IOST = require('iost');
const sleep = require('sleep')

const rpc = new IOST.RPC(new IOST.HTTPProvider("http://api.iost.io"));

let iost = new IOST.IOST({
	gasRatio: 1,
	gasLimit: 500000,
	delay: 0,
}, new IOST.HTTPProvider('http://api.iost.io'));

let config = JSON.parse(fs.readFileSync('./iost.json'), 'utf8');
let contract = config.contractAddress;
let accounts = config.accounts;

let accounts1 = JSON.parse(fs.readFileSync('./iost.json'), 'utf8').accounts;
let accounts2 = JSON.parse(fs.readFileSync('./iost2.json'), 'utf8').accounts;
let accounts3 = JSON.parse(fs.readFileSync('./iost3.json'), 'utf8').accounts;
let myaccounts = [];
accounts1.forEach(acc => {
	myaccounts.push(acc.account);
});
accounts2.forEach(acc => {
	myaccounts.push(acc.account);
});
accounts3.forEach(acc => {
	myaccounts.push(acc.account);
});

async function getExpiration(account) {
	let acc = account.account;
	let privkey = account.privateKey;
	let timeThresh = account.timeLeft;
	let mode = account.mode;
	let lastbuy = new Date();
	lastbuy = lastbuy.getTime();
	while(true) {
		let ret = await rpc.blockchain.getContractStorage(contract, "expiration", true);
		let exp = parseInt(ret.data.substring(0, 10));
		let now = new Date();
		let timeleft = Math.round(exp - now.getTime()/1000);

		if(timeleft < 0) {
			console.log("timeleft < 0, shit! exp = ", exp);
			//throw "timeleft < 0";
			continue;
		}

		ret = await rpc.blockchain.getContractStorage(contract, "last_group", true)
		let last100 = JSON.parse(ret.data);
		let flag = false;
		var sign = false;
		let account_to_buy = [];
		for(var i = 0; i < myaccounts.length; ++i) {
			if(last100.indexOf(myaccounts[i]) == -1) {
				account_to_buy.push(myaccounts[i]);
				sign = true;
			}
		}
		let rand = (n, m) => {
			var c = m-n+1; 
			return Math.floor(Math.random() * c + n);
		}
		if(sign) {
			var index = rand(0, account_to_buy.length);
			if(index == account_to_buy.length) {
				index -= 1;
			}
			acc = account_to_buy[index];
		}

		let iost_account = new IOST.Account(acc);
		const pk = new IOST.KeyPair(bs58.decode(privkey));
		iost_account.addKeyPair(pk, "owner");
		iost_account.addKeyPair(pk, "active");

		var last1 = last100[last100.length - 1];
		if(myaccounts.indexOf(last1) != -1) {
			console.log("myaccount is the last 1");
			flag = true;
		}
		if(account_to_buy.length == 0) {
			flag = true;
		}
		console.log("timeleft:" + timeleft + ", account:" + acc + ", flag --> " + flag)
		var bought = false;
		if(sign && !flag && timeleft < timeThresh && now.getTime() - lastbuy >= 3000) {
			// buy a box
			bought = true;
			lastbuy = now.getTime();
			console.log("buy a box for account:", acc);
			let tx = iost.callABI(contract, "buyBox", [acc, "1", "ccyanxyz"]);
			tx.addApprove("iost", 50)
			iost_account.signTx(tx);
			let handler = new IOST.TxHandler(tx, rpc);
			handler.onPending(console.log)
					.onSuccess(console.log)
					.onFailed(console.log)
					.send()
					.listen();
			sleep.msleep(3000);
		}
	}
}

getExpiration(accounts[0]);
