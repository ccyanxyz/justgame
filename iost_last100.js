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
let contract = config.contractAddress;
let accounts = config.accounts;

async function getExpiration(accounts) {
		await rpc.blockchain.getContractStorage(contract, "last_group", true).then(ret => {
				let last100 = JSON.parse(ret.data);
				console.log(last100);
			})
}

getExpiration(accounts);
