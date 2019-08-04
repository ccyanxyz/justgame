var fs = require('fs')
var TronWeb = require('tronweb')
var fly = require('flyio')
var HttpProvider = TronWeb.providers.HttpProvider;

let config = JSON.parse(fs.readFileSync('./tron.json'), 'utf8');
let node = "https://api.trongrid.io";
let accounts = config.accounts;
let contractAddress = config.contractAddress;

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
	while(flag) {
		try {
			await tronWeb.contract().at(contractAddress).then(contract => {
				if(mode == "last100") {
					contract['isInLastActivePlayers'](addr).call().then(inLast100 => {
						console.log(addr + ' in last 100:', inLast100);

						fly.get("/api/contracts/transaction?sort=-timestamp&count=true&limit=100&contract=" + contractAddress).then(ret => {
							let body = JSON.parse(ret.response.body);
							let lastAddr = body.data[0].ownAddress;
							for(var i = 0; i < body.data.length; ++i) {
								if(body.data[i].value > 0 && body.data[i].contractRet == "SUCCESS") {
									lastAddr = body.data[i].ownAddress;
									break;
								}
							}
							let flag = false;
							for(var i = 0; i < accounts.length; ++i) {
								if(lastAddr.toLowerCase() == accounts[i].address.toLowerCase()) {
									flag = true;
									break;
								}
							}
							contract['expiration']().call().then(ret => {
								let exp = parseInt(ret)
								let now = new Date()
								let timeLeft = Math.round(exp - now.getTime()/1000);
								if(timeLeft < 0) {
									console.log("timeleft < 0! exp = ", exp);
									throw "timeleft < 0, shit";
								} 
								console.log("time left: ", timeLeft, "s");
								if(timeLeft < timeThresh && !inLast100 && !flag) {
									contract['buy'](1, addr).send({
										callValue: 25000000,
									}).then(ret => {
										console.log(ret);
									}).catch(err => {
										console.log("buy error:", err);
									})
								}
							}).catch(err => {
								console.log("error get expiration, err:", err);
							})
						}).catch(err => {
							console.log("in last100, api error:", err);
						})
					}).catch(err => {
						console.log("error call contract, err:", err);
					})
				} else if(mode == "last1") {
					fly.get("/api/contracts/transaction?sort=-timestamp&count=true&limit=100&contract=" + contractAddress).then(ret => {
						let body = JSON.parse(ret.response.body);
						let lastAddr = body.data[0].ownAddress;
						for(var i = 0; i < body.data.length; ++i) {
							if(body.data[i].value > 0 && body.data[i].contractRet == "SUCCESS") {
								lastAddr = body.data[i].ownAddress;
								break;
							}
						}
						let isLastOne = (lastAddr.toLowerCase() == addr.toLowerCase());
						let flag = false;
						for(var i = 0; i < accounts.length; ++i) {
							if(lastAddr.toLowerCase() == accounts[i].address.toLowerCase()) {
								flag = true;
								break;
							}
						}
						contract['expiration']().call().then(ret => {
							let exp = parseInt(ret)
							let now = new Date()
							let timeLeft = Math.round(exp - now.getTime()/1000);
							if(timeLeft < 0) {
								console.log("timeleft < 0! exp = ", exp);
								throw "timeleft < 0, shit";
							}
							console.log("timeleft:" + timeLeft + "," + addr + " is the last one:" + isLastOne + ",flag:" + flag);
							if(timeLeft < timeThresh && !isLastOne && !flag) {
								contract['buy'](1, addr).send({
									callValue: 25000000,
								}).then(ret => {
									console.log(ret);
								}).catch(err => {
									console.log("buy error:", err);
								})
							}
						}).catch(err => {
							console.log("error get expiration, err:", err);
						})
					}).catch(err => {
						console.log("api request error, err:", err);
					})
				}
			})
		} catch (err) {
			console.log("caught err:", err);
		}
	}
}

accounts.forEach(getExpiration);
