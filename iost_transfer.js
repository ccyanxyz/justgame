const fs = require('fs')
const bs58 = require('bs58')
const IOST = require('iost');

const rpc = new IOST.RPC(new IOST.HTTPProvider("http://api.iost.io"));

let iost = new IOST.IOST({
	gasRatio: 1,
	gasLimit: 500000,
	delay: 0,
}, new IOST.HTTPProvider('http://api.iost.io'));

let config = JSON.parse(fs.readFileSync('./iost.json'), 'utf8');
let config2 = JSON.parse(fs.readFileSync('./iost2.json'), 'utf8');
let contract = config.contractAddress;
let accounts1 = config.accounts;
let accounts2 = config2.accounts;

let accounts = [];
for(var i = 0; i < accounts1.length; ++i) {
	if(accounts1.account != "ccyanxyz") {
		accounts.push(accounts1[i]);
	}
}
for(var i = 0; i < accounts2.length; ++i) {
	if(accounts2.account != "ccyanxyz") {
		accounts.push(accounts2[i]);
	}
}

async function transfer(accounts) {
	for(var t = 0; t < accounts.length; ++t) {
		var account = accounts[t];
		let acc = account.account;
		let privkey = account.privateKey;
		let timeThresh = account.timeLeft;
		let mode = account.mode;

		let iost_account = new IOST.Account("ccyanxyz");
		const pk = new IOST.KeyPair(bs58.decode(privkey));
		iost_account.addKeyPair(pk, "owner");
		iost_account.addKeyPair(pk, "active");

		let tx = iost.transfer("iost", "ccyanxyz", acc, "400", "");
		iost_account.signTx(tx);
		let handler = new IOST.TxHandler(tx, rpc);
		handler.onPending(console.log)
				.onSuccess(console.log)
				.onFailed(console.log)
				.send()
				.listen();
	}
}

transfer(accounts);
