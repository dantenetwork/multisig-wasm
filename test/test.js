/*
 * @Description: 
 * @Author: kay
 * @Date: 2021-06-02 14:28:03
 * @LastEditTime: 2021-06-08 11:48:07
 * @LastEditors: kay
 */

const chai = require('chai')
const expect = chai.expect

const Web3 = require('web3');

const web3 = new Web3('http://192.168.1.65:6789');

const manager1PrivateKey = '0x978c6b5b7504674d10b3548669c739acf5bf69041f69374d188d9dbe1d3ce204';
const manager1Address = 'lat1q949tup3qkgdvu223qu5yyee4knhfchp40lpgh';
const manager2PrivateKey = '0xa5da67b71327332f8a22c39d472089d3f30a1f7d30e2528d710c53beae703eaa';
const manager2Address = 'lat17jemcasgq2vdq0urysvldn84q7dxe3ekrlhf39';
const manager3PrivateKey = '0xcfa83bd35a6607c319722d9539b2fe9910270328fc1839e0a9c1c20310d6c9cf';
const manager3Address = 'lat182966a4jv369w9wss6lqk07wlxagv84tjmk87z';

const manager4PrivateKey = '0x63d5958d8098c0a206b2a300913ff9295de5b3f1e2600c71463e7dc3f0929b09';
const manager4Address = 'lat1c9s7qxxljhh2rhy48njr0pluxw960f6ge0lyj7';
const manager5PrivateKey = '0xd25d998b04a0f4192243b7825f26c490b0850ae4dcf5b620267021519d0c7bc6';
const manager5Address = 'lat1tendk8jk4fjlawfr7paju76t482khpzau2efk7';

const nonManagerPrivateKey = '0x471c539b09547e19af9362d96340af8fc85e6559ed32a32e49126ae0dba0a46a';

const ownerAddress = "lat15nqll7dfn4km00lz6nd4ahxya5gals9d2f7sn8"; // owner address
const ownerPrivateKey = "0xdf08319532a92397ceb5b7fd0debe9195a0a79657127bb920ff258774e9f0d01"; /// owner private key
const contractAddress = "lat1tayk7lm979fc4zuccfcxmjqt8lxvwf58c6pqha"; // contract address
const zeroAddress = web3.utils.toBech32Address('lat', "0x0000000000000000000000000000000000000000");
const expiredProposalName = "ExpiredProposal";
const abi = [{"constant":false,"input":[{"name":"managers","type":"set<string>"},{"name":"requires","type":"uint8"}],"name":"init","output":"void","type":"Action"},{"constant":false,"input":[{"name":"proposal_name","type":"string"},{"name":"contract_addr","type":"string"},{"name":"to","type":"string"},{"name":"amount","type":"uint128"},{"name":"expiration","type":"int64"}],"name":"propose","output":"bool","type":"Action"},{"constant":false,"input":[{"name":"proposal_name","type":"string"}],"name":"approve","output":"bool","type":"Action"},{"constant":false,"input":[{"name":"proposal_name","type":"string"},{"name":"new_managers","type":"set<string>"},{"name":"requires","type":"uint8"}],"name":"add_managers","output":"bool","type":"Action"},{"constant":false,"input":[{"name":"proposal_name","type":"string"},{"name":"old_managers","type":"set<string>"},{"name":"requires","type":"uint8"}],"name":"remove_managers","output":"bool","type":"Action"},{"constant":false,"input":[{"name":"proposal_name","type":"string"}],"name":"execute","output":"bool","type":"Action"},{"constant":true,"input":[],"name":"get_requires","output":"uint8","type":"Action"},{"constant":true,"input":[],"name":"get_managers","output":"set<string>","type":"Action"},{"baseclass":[],"fields":[{"name":"contract_addr","type":"string"},{"name":"to","type":"string"},{"name":"amount","type":"uint128"},{"name":"expiration","type":"int64"}],"name":"Proposal","type":"struct"},{"constant":true,"input":[{"name":"proposal_name","type":"string"}],"name":"get_proposal","output":"Proposal","type":"Action"},{"baseclass":[],"fields":[{"name":"managers","type":"set<string>"},{"name":"approvers","type":"set<string>"},{"name":"action_type","type":"uint8"},{"name":"requires","type":"uint8"}],"name":"Manager","type":"struct"},{"constant":true,"input":[{"name":"proposal_name","type":"string"}],"name":"get_update_managers_proposal","output":"Manager","type":"Action"},{"constant":true,"input":[{"name":"proposal_name","type":"string"}],"name":"get_approval","output":"set<string>","type":"Action"}];
const TOKEN = "100000000000000";

let contract = new web3.platon.Contract(abi, contractAddress, { vmType: 1 });

// transfer
(async () => {
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
  // console.log(receipt);
})();

(async () => {
  contract.methods.get_proposal("ExpiredProposal").call((error, result) => {
    if (!result[0]) {
      (async () => {
        const signTx = await signTransaction("propose", manager1PrivateKey, [expiredProposalName, zeroAddress, ownerAddress, TOKEN, 1]);
        const receipt = await web3.platon.sendSignedTransaction(signTx.rawTransaction);
        console.log("transaction id: " + receipt.transactionHash, ", transaction status: " + receipt.status);
      })();
    }
  });
})();


// 合约的查询接口
describe('Multisig Test Cases', () => {
  // 验证智能合约 requires
  describe('requires', () => {
    const requires = 2;
    it("Multisig requires should equal " + requires, () => {
      return contract.methods.get_requires().call(null, (error, result) => {
        expect(result).to.equal(requires);
      });
    });
  });

  // 验证多签合约 managers
  describe('get_managers', () => {
    const managers = [manager2Address, manager3Address, manager1Address];
    it("Multisig managers should equal " + managers, () => {
      return contract.methods.get_managers().call(null, (error, result) => {
        for (let i in result) {
          expect(result[i]).to.equal(managers[i]);
        }
      });
    });
  });

});

//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////
//////////////////////////////////////////

// 合约的执行接口
describe('Multisig Action Test Cases', () => {
  // 测试 manager 账户发起多签提案
  const proposalName = "transfer1";
  const erc20Address = 'lat1xxyk4fm9m7lst5y8t59ce2ueht0uprre9gwzes'
  const expireTime = 0;
  describe('Propose', () => {
    it("Transaction status should equal true", async function () {
      this.timeout(0);
      const signTx = await signTransaction("propose", manager1PrivateKey, [proposalName, zeroAddress, ownerAddress, TOKEN, expireTime]);

      // 发送交易
      const receipt = await web3.platon.sendSignedTransaction(signTx.rawTransaction);
      console.log("transaction id: " + receipt.transactionHash, ", transaction status: " + receipt.status);
      expect(receipt.status).to.true;
    });
  });

  // 测试非管理员账户批准多签提案
  describe('Approve by non manager', () => {
    it("Approve " + proposalName + ", status should equal false", async function () {
      this.timeout(0);

      // non manager 发送 approve 交易
      let signTx = await signTransaction("approve", nonManagerPrivateKey, [proposalName]);
      try {
        await web3.platon.sendSignedTransaction(signTx.rawTransaction);
        expect(1).to.equal(0);
      } catch (error) {
        console.log("transaction id: " + error.receipt.transactionHash, ", transaction status: " + error.receipt.status);
        expect(error).to.an("Error");
      }
    });
  });

  // 测试 manager approve 提案
  describe('Approve', () => {
    it("Approve " + proposalName + ", status should equal true", async function () {
      this.timeout(0);

      // manager2 发送 approve 交易
      let signTx = await signTransaction("approve", manager2PrivateKey, [proposalName]);
      let receipt = await web3.platon.sendSignedTransaction(signTx.rawTransaction);
      console.log("transaction id: " + receipt.transactionHash, ", transaction status: " + receipt.status);
      expect(receipt.status).to.true;

      // manager3 发送 approve 交易
      signTx = await signTransaction("approve", manager3PrivateKey, [proposalName]);
      receipt = await web3.platon.sendSignedTransaction(signTx.rawTransaction);
      console.log("transaction id: " + receipt.transactionHash, ", transaction status: " + receipt.status);
      expect(receipt.status).to.true;
    });
  });

  // 测试执行多签提案
  describe('Execute', () => {
    it("Execute proposal " + proposalName + ", status should equal true", async function () {
      this.timeout(0);
      const signTx = await signTransaction("execute", manager1PrivateKey, [proposalName]);

      // 发送交易
      const receipt = await web3.platon.sendSignedTransaction(signTx.rawTransaction);
      console.log("transaction id: " + receipt.transactionHash, ", transaction status: " + receipt.status);
      expect(receipt.status).to.true;
    });
  });

  // 测试 manager approve 提案
  describe('Approve expired proposal', () => {
    it("Approve " + expiredProposalName + ", status should equal true", async function () {
      this.timeout(0);

      // manager2 发送 approve 交易
      let signTx = await signTransaction("approve", manager2PrivateKey, [expiredProposalName]);
      try {
        await web3.platon.sendSignedTransaction(signTx.rawTransaction);
        expect(1).to.equal(0);
      } catch (error) {
        console.log("transaction id: " + error.receipt.transactionHash, ", transaction status: " + error.receipt.status);
        expect(error).to.an("Error");
      }
    });
  });

  // 测试添加管理员的多签提案
  describe('Propose add managers', () => {
    const addManagerProposalName = "AddManagers";
    it("Transaction status should equal true", async function () {
      this.timeout(0);
      const signTx = await signTransaction("add_managers", manager1PrivateKey, [addManagerProposalName, [manager4Address], 2]);

      // 发送交易
      const receipt = await web3.platon.sendSignedTransaction(signTx.rawTransaction);
      console.log("transaction id: " + receipt.transactionHash, ", transaction status: " + receipt.status);
      expect(receipt.status).to.true;
    });
  });
  
  // 测试 approve 添加管理员的多提案
  describe('Approve add managers', () => {
    const proposalName = "AddManagers";
    it("Approve " + proposalName + ", status should equal true", async function () {
      this.timeout(0);

      // manager2 发送 approve 交易
      let signTx = await signTransaction("approve", manager2PrivateKey, [proposalName]);
      let receipt = await web3.platon.sendSignedTransaction(signTx.rawTransaction);
      console.log("transaction id: " + receipt.transactionHash, ", transaction status: " + receipt.status);
      expect(receipt.status).to.true;

      // manager3 发送 approve 交易
      signTx = await signTransaction("approve", manager3PrivateKey, [proposalName]);
      receipt = await web3.platon.sendSignedTransaction(signTx.rawTransaction);
      console.log("transaction id: " + receipt.transactionHash, ", transaction status: " + receipt.status);
      expect(receipt.status).to.true;
    });
  });

  // 测试执行添加管理员的多签提案
  describe('Execute add managers', () => {
    const proposalName = "AddManagers"
    it("Execute proposal " + proposalName + ", status should equal true", async function () {
      this.timeout(0);
      const signTx = await signTransaction("execute", manager1PrivateKey, [proposalName]);

      // 发送交易
      const receipt = await web3.platon.sendSignedTransaction(signTx.rawTransaction);
      console.log("transaction id: " + receipt.transactionHash, ", transaction status: " + receipt.status);
      expect(receipt.status).to.true;
    });
  });
  
  // 验证 add managers 是否成功
  describe('get_managers', () => {
    const managers = [manager2Address, manager3Address, manager4Address, manager1Address];
    it("Multisig managers should equal " + managers, () => {
      return contract.methods.get_managers().call(null, (error, result) => {
        for (let i in result) {
          expect(result[i]).to.equal(managers[i]);
        }
      });
    });
  });

  // 测试添加管理员的多签提案
  describe('Propose remove managers', () => {
    const proposalName = "RemoveManagers";
    it("Transaction status should equal true", async function () {
      this.timeout(0);
      const signTx = await signTransaction("remove_managers", manager1PrivateKey, [proposalName, [manager4Address], 2]);

      // 发送交易
      const receipt = await web3.platon.sendSignedTransaction(signTx.rawTransaction);
      console.log("transaction id: " + receipt.transactionHash, ", transaction status: " + receipt.status);
      expect(receipt.status).to.true;
    });
  });

  // 测试 approve 添加管理员的多提案
  describe('Approve remove managers', () => {
    const proposalName = "RemoveManagers";
    it("Approve " + proposalName + ", status should equal true", async function () {
      this.timeout(0);

      // manager2 发送 approve 交易
      let signTx = await signTransaction("approve", manager2PrivateKey, [proposalName]);
      let receipt = await web3.platon.sendSignedTransaction(signTx.rawTransaction);
      console.log("transaction id: " + receipt.transactionHash, ", transaction status: " + receipt.status);
      expect(receipt.status).to.true;

      // manager3 发送 approve 交易
      signTx = await signTransaction("approve", manager3PrivateKey, [proposalName]);
      receipt = await web3.platon.sendSignedTransaction(signTx.rawTransaction);
      console.log("transaction id: " + receipt.transactionHash, ", transaction status: " + receipt.status);
      expect(receipt.status).to.true;
    });
  });

  // 测试执行删除管理员的多签提案
  describe('Execute remove managers', () => {
    const proposalName = "RemoveManagers"
    it("Execute proposal " + proposalName + ", status should equal true", async function () {
      this.timeout(0);
      const signTx = await signTransaction("execute", manager1PrivateKey, [proposalName]);

      // 发送交易
      const receipt = await web3.platon.sendSignedTransaction(signTx.rawTransaction);
      console.log("transaction id: " + receipt.transactionHash, ", transaction status: " + receipt.status);
      expect(receipt.status).to.true;
    });
  });

  // 验证 add managers 是否成功
  describe('get_managers', () => {
    const managers = [manager2Address, manager3Address, manager1Address];
    it("Multisig managers should equal " + managers, () => {
      return contract.methods.get_managers().call(null, (error, result) => {
        for (let i in result) {
          expect(result[i]).to.equal(managers[i]);
        }
      });
    });
  });
});

//////////////////////////////////////////

// 通过私钥签名交易
async function signTransaction(actionName, privateKey, paramsArray) {
  let from = web3.platon.accounts.privateKeyToAccount(privateKey).address; // 私钥导出公钥
  console.log(from)
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
}