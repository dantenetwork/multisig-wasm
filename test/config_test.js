/*
 * @Description: 
 * @Author: kay
 * @Date: 2021-06-23 11:07:42
 * @LastEditTime: 2021-06-23 17:10:56
 * @LastEditors: kay
 */

const Web3 = require('web3');

const web3 = new Web3('http://192.168.1.65:6789');
var abi = require('../build/contracts/multisig.abi.json');
var erc20Abi = [{ "anonymous": false, "input": [{ "name": "topic", "type": "FixedHash<20>" }, { "name": "arg1", "type": "uint128" }], "name": "Burn", "topic": 1, "type": "Event" }, { "constant": true, "input": [], "name": "getOwner", "output": "string", "type": "Action" }, { "constant": true, "input": [{ "name": "_owner", "type": "FixedHash<20>" }, { "name": "_spender", "type": "FixedHash<20>" }], "name": "allowance", "output": "uint128", "type": "Action" }, { "anonymous": false, "input": [{ "name": "topic1", "type": "FixedHash<20>" }, { "name": "topic2", "type": "FixedHash<20>" }, { "name": "arg1", "type": "uint128" }], "name": "Transfer", "topic": 2, "type": "Event" }, { "anonymous": false, "input": [{ "name": "topic1", "type": "FixedHash<20>" }, { "name": "topic2", "type": "FixedHash<20>" }, { "name": "arg1", "type": "uint128" }], "name": "Approval", "topic": 2, "type": "Event" }, { "constant": true, "input": [{ "name": "_owner", "type": "FixedHash<20>" }], "name": "balanceOf", "output": "uint128", "type": "Action" }, { "constant": false, "input": [{ "name": "_to", "type": "FixedHash<20>" }, { "name": "_value", "type": "uint128" }], "name": "transfer", "output": "bool", "type": "Action" }, { "constant": false, "input": [{ "name": "_from", "type": "FixedHash<20>" }, { "name": "_to", "type": "FixedHash<20>" }, { "name": "_value", "type": "uint128" }], "name": "transferFrom", "output": "bool", "type": "Action" }, { "constant": false, "input": [{ "name": "_spender", "type": "FixedHash<20>" }, { "name": "_value", "type": "uint128" }], "name": "approve", "output": "bool", "type": "Action" }, { "anonymous": false, "input": [{ "name": "topic", "type": "FixedHash<20>" }, { "name": "arg1", "type": "uint128" }], "name": "Mint", "topic": 1, "type": "Event" }, { "constant": false, "input": [{ "name": "_name", "type": "string" }, { "name": "_symbol", "type": "string" }, { "name": "_decimals", "type": "uint8" }], "name": "init", "output": "void", "type": "Action" }, { "constant": false, "input": [{ "name": "_account", "type": "FixedHash<20>" }, { "name": "_value", "type": "uint128" }], "name": "mint", "output": "bool", "type": "Action" }, { "constant": false, "input": [{ "name": "_account", "type": "FixedHash<20>" }, { "name": "_value", "type": "uint128" }], "name": "burn", "output": "bool", "type": "Action" }, { "constant": false, "input": [{ "name": "_account", "type": "FixedHash<20>" }], "name": "setOwner", "output": "bool", "type": "Action" }, { "constant": true, "input": [], "name": "getName", "output": "string", "type": "Action" }, { "constant": true, "input": [], "name": "getDecimals", "output": "uint8", "type": "Action" }, { "constant": true, "input": [], "name": "getSymbol", "output": "string", "type": "Action" }, { "constant": true, "input": [], "name": "getTotalSupply", "output": "uint128", "type": "Action" }];
var contractAddress = "lat1vf9fq3t6ayc4ye0f0rneejc2clye3yuxtpunka";
const erc20Contract = new web3.platon.Contract(erc20Abi, { vmType: 1 });
const contract = new web3.platon.Contract(abi, contractAddress, { vmType: 1 });

// 通过私钥签名交易
async function signTransaction(actionName, privateKey, paramsArray) {
  let from = web3.platon.accounts.privateKeyToAccount(privateKey).address; // 私钥导出公钥
  let nonce = web3.utils.numberToHex(await web3.platon.getTransactionCount(from)); // 获取 生成 nonce
  let data = contract.methods[actionName].apply(contract.methods, paramsArray).encodeABI(); // encode ABI
  // 准备交易数据
  let tx = {
    from: from,
    to: contractAddress,
    value: 0,
    chainId: 210309,
    data: data,
    nonce: nonce,
    gas: "2000000"
  };

  // 签名交易
  let signTx = await web3.platon.accounts.signTransaction(tx, privateKey);
  return signTx;
};

module.exports = {
  manager1PrivateKey: '0x978c6b5b7504674d10b3548669c739acf5bf69041f69374d188d9dbe1d3ce204',
  manager1Address: 'lat1q949tup3qkgdvu223qu5yyee4knhfchp40lpgh',
  manager2PrivateKey: '0xa5da67b71327332f8a22c39d472089d3f30a1f7d30e2528d710c53beae703eaa',
  manager2Address: 'lat17jemcasgq2vdq0urysvldn84q7dxe3ekrlhf39',
  manager3PrivateKey: '0xcfa83bd35a6607c319722d9539b2fe9910270328fc1839e0a9c1c20310d6c9cf',
  manager3Address: 'lat182966a4jv369w9wss6lqk07wlxagv84tjmk87z',

  manager4PrivateKey: '0x63d5958d8098c0a206b2a300913ff9295de5b3f1e2600c71463e7dc3f0929b09',
  manager4Address: 'lat1c9s7qxxljhh2rhy48njr0pluxw960f6ge0lyj7',
  manager5PrivateKey: '0xd25d998b04a0f4192243b7825f26c490b0850ae4dcf5b620267021519d0c7bc6',
  manager5Address:'lat1tendk8jk4fjlawfr7paju76t482khpzau2efk7',

  nonManagerPrivateKey: '0x471c539b09547e19af9362d96340af8fc85e6559ed32a32e49126ae0dba0a46a',

  ownerAddress: "lat15nqll7dfn4km00lz6nd4ahxya5gals9d2f7sn8", // owner address
  ownerPrivateKey: "0xdf08319532a92397ceb5b7fd0debe9195a0a79657127bb920ff258774e9f0d01", /// owner private key
  expiredProposalName: "ExpiredProposal",
  TOKEN: "100000000000000",
  erc20Address: "lat14ppaelz6ldke6kss4uw0ygtq2km93444hvy2p8",
  web3,
  contractAddress,
  erc20Contract,
  contract,
  signTransaction
};