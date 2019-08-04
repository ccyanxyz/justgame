var Web3 = require('web3');
var fs = require('fs');
var fly = require('flyio')
var Tx = require('ethereumjs-tx')

if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
} else {
    // set the provider you want from Web3.providers
    web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/bda996b482e944bdbd5bad497e8f7205"));
}

let config = JSON.parse(fs.readFileSync('./eth.json'), 'utf8');
var contract = config.contractAddress;
var accounts = config.accounts;

let config2 = JSON.parse(fs.readFileSync('./eth2.json'), 'utf8');
var accounts2 = config2.accounts;
var myaccounts = []
for(var i = 0; i < accounts.length; ++i) {
	myaccounts.push(accounts[i]);
}
for(var i = 0; i < accounts2.length - 1; ++i) {
	myaccounts.push(accounts2[i]);
}

fly.config.baseURL = "http://api.etherscan.io"
var params = "/api?module=account&action=txlist&address=0x3C6970D3b1E72a9a5F47a2ED7E1724223905789c&startblock=8181000&sort=desc&apikey=RYQVAZFW11SBU867H4HF6IBXTCB3RFZPUM";
var referal = "0x3a9783F7264a48be84CDb0957Bd8Eb9Ae305DA37";

async function getExpiration(account) {
	var address = account.address.toLowerCase();
	var privatekey = account.privateKey;
	var mode = account.mode;
	var timeThresh = account.timeLeft;
	var bought =false;
	while(true) {
		var start = new Date();
		while(true) {
			var end = new Date();
			if(end.getTime() - start.getTime() >= 100) {
				break;
			}
		}
		await web3.eth.call({
			to: contract,
			data: "0x4665096d"
		}).then(ret => {
			var exp = parseInt(ret, 16);
			var now = new Date();
			let countdown = Math.round(exp - now.getTime()/1000);
			if(countdown < 0) {
				console.log("timeleft < 0, shit");
				//throw "timeleft < 0, shit";
			}
		
			// get tx
			fly.get(params).then(ret => {
				var body = JSON.parse(ret.response.body);
				var tx = body.result;
				var count = 0;
				var flag = false;

				for(var i = 0; i < tx.length && count < 100; ++i) {
					if(parseInt(tx[i].value) >= 2500000000000000) {
						if(count == 0) {
							for(var j = 0; j < myaccounts.length; ++j) {
								if(tx[i].from == myaccounts[j].address.toLowerCase()) {
									flag = true;
									break;
								}
							}
						}
						if(flag) {
							break;
						}
						if(mode == "last1" && count == 0) {
							if(tx[i].from == address) {
								flag = true;
							}
							break;
						} else if(mode == "last100") {
							count += 1;
							if(tx[i].from == address) {
								flag = true;
								break;
							}
						}
					}
				}

				console.log("timeleft:" + countdown + "s, mode:" + mode + ", addr:" + address.substring(0, 5) + " --> " + flag);
				if(!flag && countdown < timeThresh) {
					var param1 = web3.utils.toHex(1).substring(2).padStart(64, "0");
					var param2 = web3.utils.toHex(referal).substring(2).padStart(64, "0");
					var data = "0x7deb6025" + param1 + param2;
					console.log(data);
					web3.eth.getTransactionCount(address).then(nonce => {
						// buy a box
						var rawTx = {
							nonce: "0x" + nonce.toString(16),
							gasPrice: "0x4a817c800", 
							gasLimit: "0x4c67a",
							to: contract,
							value: web3.utils.toHex(2500000000000000),
							data: data 
						};

						var tx = new Tx.Transaction(rawTx);
						var pk = Buffer.from(privatekey, 'hex');
						tx.sign(pk);
						var serializedTx = tx.serialize();
						console.log("buy a box for:", address);
						web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).on('receipt', console.log).on('error', console.log).catch(err => {
							console.log(err);
						})
					}).catch(err => {
						console.log("get nonce error:", err);
					})
				}
			}).catch(err => {
				console.log("getTx error:", err);
			})
		}).catch(err => {
			console.log("get expiration error:", err);
		})
	}
}

//accounts.forEach(getExpiration);
getExpiration(accounts[0])
