/*
 * @Description: 
 * @Author: kay
 * @Date: 2021-06-24 15:28:49
 * @LastEditTime: 2021-06-25 10:55:13
 * @LastEditors: kay
 */

const Web3 = require('web3');
const fs = require('fs-extra')
const path = require('path');
const web3 = new Web3('http://192.168.1.65:6789');
const binFilePath = "../build/contracts/multisig.wasm";
var abi = require('../build/contracts/multisig.abi.json');
const erc20Abi = [{ "anonymous": false, "input": [{ "name": "topic", "type": "FixedHash<20>" }, { "name": "arg1", "type": "uint128" }], "name": "Burn", "topic": 1, "type": "Event" }, { "constant": true, "input": [], "name": "getOwner", "output": "string", "type": "Action" }, { "constant": true, "input": [{ "name": "_owner", "type": "FixedHash<20>" }, { "name": "_spender", "type": "FixedHash<20>" }], "name": "allowance", "output": "uint128", "type": "Action" }, { "anonymous": false, "input": [{ "name": "topic1", "type": "FixedHash<20>" }, { "name": "topic2", "type": "FixedHash<20>" }, { "name": "arg1", "type": "uint128" }], "name": "Transfer", "topic": 2, "type": "Event" }, { "anonymous": false, "input": [{ "name": "topic1", "type": "FixedHash<20>" }, { "name": "topic2", "type": "FixedHash<20>" }, { "name": "arg1", "type": "uint128" }], "name": "Approval", "topic": 2, "type": "Event" }, { "constant": true, "input": [{ "name": "_owner", "type": "FixedHash<20>" }], "name": "balanceOf", "output": "uint128", "type": "Action" }, { "constant": false, "input": [{ "name": "_to", "type": "FixedHash<20>" }, { "name": "_value", "type": "uint128" }], "name": "transfer", "output": "bool", "type": "Action" }, { "constant": false, "input": [{ "name": "_from", "type": "FixedHash<20>" }, { "name": "_to", "type": "FixedHash<20>" }, { "name": "_value", "type": "uint128" }], "name": "transferFrom", "output": "bool", "type": "Action" }, { "constant": false, "input": [{ "name": "_spender", "type": "FixedHash<20>" }, { "name": "_value", "type": "uint128" }], "name": "approve", "output": "bool", "type": "Action" }, { "anonymous": false, "input": [{ "name": "topic", "type": "FixedHash<20>" }, { "name": "arg1", "type": "uint128" }], "name": "Mint", "topic": 1, "type": "Event" }, { "constant": false, "input": [{ "name": "_name", "type": "string" }, { "name": "_symbol", "type": "string" }, { "name": "_decimals", "type": "uint8" }], "name": "init", "output": "void", "type": "Action" }, { "constant": false, "input": [{ "name": "_account", "type": "FixedHash<20>" }, { "name": "_value", "type": "uint128" }], "name": "mint", "output": "bool", "type": "Action" }, { "constant": false, "input": [{ "name": "_account", "type": "FixedHash<20>" }, { "name": "_value", "type": "uint128" }], "name": "burn", "output": "bool", "type": "Action" }, { "constant": false, "input": [{ "name": "_account", "type": "FixedHash<20>" }], "name": "setOwner", "output": "bool", "type": "Action" }, { "constant": true, "input": [], "name": "getName", "output": "string", "type": "Action" }, { "constant": true, "input": [], "name": "getDecimals", "output": "uint8", "type": "Action" }, { "constant": true, "input": [], "name": "getSymbol", "output": "string", "type": "Action" }, { "constant": true, "input": [], "name": "getTotalSupply", "output": "uint128", "type": "Action" }];
const erc20Address = "lat14ppaelz6ldke6kss4uw0ygtq2km93444hvy2p8"
const erc20Contract = new web3.platon.Contract(erc20Abi, erc20Address, { vmType: 1 });
const contract = new web3.platon.Contract(abi, { vmType: 1 });
const ownerAddress = 'lat15nqll7dfn4km00lz6nd4ahxya5gals9d2f7sn8';
const ownerPrivateKey = '0xdf08319532a92397ceb5b7fd0debe9195a0a79657127bb920ff258774e9f0d01';
const chainId = 210309;
let manager1Address = "lat1q949tup3qkgdvu223qu5yyee4knhfchp40lpgh";
let manager2Address = "lat17jemcasgq2vdq0urysvldn84q7dxe3ekrlhf39";
let manager3Address = "lat182966a4jv369w9wss6lqk07wlxagv84tjmk87z";

let contractAddress = "";
async function deployContract() {
  let bin = (await fs.readFile(binFilePath)).toString("hex");
  let nonce = web3.utils.numberToHex(await web3.platon.getTransactionCount(ownerAddress));
  let gasPrice = web3.utils.numberToHex(await web3.platon.getGasPrice());
  let gas = web3.utils.numberToHex(parseInt((await web3.platon.getBlock("latest")).gasLimit - 1));
  let data = contract.deploy({
    data: bin,
    arguments: [[manager1Address, manager2Address, manager3Address], 2]
  }).encodeABI();
  let tx = { gasPrice, gas, nonce, chainId, data };
  let signTx = await web3.platon.accounts.signTransaction(tx, ownerPrivateKey);
  ret = await web3.platon.sendSignedTransaction(signTx.rawTransaction);
  contractAddress = ret.contractAddress;
  var file = path.join(__dirname, 'contractAddress.json');
  fs.writeFile(file, JSON.stringify(ret.contractAddress), function (err) {
    if (err) {
      return console.log(err);
    }
  });
};


async function transferLAT(){
  let balance = await web3.platon.getBalance(contractAddress);
  // console.log(balance)
  const TOKEN = "100000000000000";
  if (parseInt(balance) <= parseInt(TOKEN)) {
    let nonce = web3.utils.numberToHex(await web3.platon.getTransactionCount(ownerAddress)); // 获取 生成 nonce

    let tx = {
      from: ownerAddress,
      to: contractAddress,
      value: TOKEN,
      chainId: 210309,
      nonce: nonce,
      gas: "2000000"
    };
    // 签名交易
    let signTx = await web3.platon.accounts.signTransaction(tx, ownerPrivateKey);
    const receipt = await web3.platon.sendSignedTransaction(signTx.rawTransaction);
  }
};

async function transferPrc20() {
  let nonce = web3.utils.numberToHex(await web3.platon.getTransactionCount(ownerAddress));
  let gasPrice = web3.utils.numberToHex(await web3.platon.getGasPrice());
  let gas = web3.utils.numberToHex(parseInt((await web3.platon.getBlock("latest")).gasLimit - 1));
  console.log(contractAddress)
  let data = erc20Contract.methods["transfer"].apply(erc20Contract.methods, [contractAddress, "100000000000000000000"]).encodeABI();
  let from = ownerAddress;
  let to = erc20Address;
  let tx = { from, to, gasPrice, gas, nonce, chainId, data };
  let signTx = await web3.platon.accounts.signTransaction(tx, ownerPrivateKey);
  ret = await web3.platon.sendSignedTransaction(signTx.rawTransaction);
  console.log(ret)
};

(async () => {
  await deployContract();
  await transferPrc20();
  await transferLAT();
})();