/*
 * @Description: 
 * @Author: kay
 * @Date: 2021-06-23 10:36:58
 * @LastEditTime: 2021-06-23 17:04:50
 * @LastEditors: kay
 */

const chai = require('chai');
const expect = chai.expect;
const config = require('./config');

// 合约的执行接口
describe('Multisig Action Test of Update Managers Proposal Cases', () => {
  // 测试 manager 账户发起多签提案
  const proposalName = "UpdateManagers";
  // 添加 manager4
  describe('Propose Update Managers proposal', () => {
    it("Transaction status should equal true", async function () {
      this.timeout(0);
      let expireTime = -1; // if <= 0, default expiration time: one day.
      let newManagers = [config.manager1Address, config.manager2Address, config.manager3Address, config.manager4Address];
      let requires = 2;
      const signTx = await config.signTransaction("propose_update_managers", config.manager1PrivateKey, [proposalName, newManagers, requires, expireTime]);

      // 发送交易
      const receipt = await config.web3.platon.sendSignedTransaction(signTx.rawTransaction);
      console.log("transaction id: " + receipt.transactionHash, ", transaction status: " + receipt.status);
      expect(receipt.status).to.true;
    });
  });

  // 测试非管理员账户批准多签提案
  describe('Approve by non manager', () => {
    it("Approve " + proposalName + ", status should equal false", async function () {
      this.timeout(0);

      // non manager 发送 approve 交易
      let signTx = await config.signTransaction("approve", config.nonManagerPrivateKey, [proposalName]);
      try {
        await config.web3.platon.sendSignedTransaction(signTx.rawTransaction);
        expect(1).to.equal(0);
      } catch (error) {
        console.log("transaction id: " + error.receipt.transactionHash, ", transaction status: " + error.receipt.status);
        expect(error).to.an("Error");
      }
    });
  });

  // 未满足 requires
  describe('execute not enough requires', () => {
    it("execute " + proposalName + ", status should equal false", async function () {
      this.timeout(0);

      // non manager 发送 approve 交易
      let signTx = await config.signTransaction("execute", config.manager1PrivateKey, [proposalName]);
      try {
        await config.web3.platon.sendSignedTransaction(signTx.rawTransaction);
        expect(1).to.equal(0);
      } catch (error) {
        console.log("transaction id: " + error.receipt.transactionHash, ", transaction status: " + error.receipt.status);
        expect(error).to.an("Error");
      }
    });
  });
  
  // 测试 manager approve 提案
  describe('Approve update managers', () => {
    it("Approve " + proposalName + ", status should equal true", async function () {
      this.timeout(0);

      // manager2 发送 approve 交易
      let signTx = await config.signTransaction("approve", config.manager2PrivateKey, [proposalName]);
      let receipt = await config.web3.platon.sendSignedTransaction(signTx.rawTransaction);
      console.log("transaction id: " + receipt.transactionHash, ", transaction status: " + receipt.status);
      expect(receipt.status).to.true;

      // manager3 发送 approve 交易
      signTx = await config.signTransaction("approve", config.manager3PrivateKey, [proposalName]);
      receipt = await config.web3.platon.sendSignedTransaction(signTx.rawTransaction);
      console.log("transaction id: " + receipt.transactionHash, ", transaction status: " + receipt.status);
      expect(receipt.status).to.true;
    });
  });

  // 测试执行多签提案
  describe('Execute update managers', () => {
    it("Execute proposal " + proposalName + ", status should equal true", async function () {
      this.timeout(0);
      const signTx = await config.signTransaction("execute", config.manager1PrivateKey, [proposalName]);

      // 发送交易
      const receipt = await config.web3.platon.sendSignedTransaction(signTx.rawTransaction);
      console.log("transaction id: " + receipt.transactionHash, ", transaction status: " + receipt.status);
      expect(receipt.status).to.true;
    });
  });

  // 
  describe('get_managers', () => {
    const managers = [config.manager2Address, config.manager3Address, config.manager4Address, config.manager1Address];
    it("Multisig managers should equal " + managers, () => {
      return config.contract.methods.get_managers().call(null, (error, result) => {
        for (let i in result) {
          expect(result[i]).to.equal(managers[i]);
        }
      });
    });
  });

  // 删除 manager4
  describe('Propose Update Managers proposal', () => {
    it("Transaction status should equal true", async function () {
      this.timeout(0);
      let expireTime = -1; // if <= 0, default expiration time: one day.
      let newManagers = [config.manager1Address, config.manager2Address, config.manager3Address];
      let requires = 2;

      // 发送交易
      let signTx = await config.signTransaction("propose_update_managers", config.manager1PrivateKey, [proposalName, newManagers, requires, expireTime]);
      let receipt = await config.web3.platon.sendSignedTransaction(signTx.rawTransaction);
      expect(receipt.status).to.true;
      
      // manager2 发送 approve 交易
      signTx = await config.signTransaction("approve", config.manager2PrivateKey, [proposalName]);
      receipt = await config.web3.platon.sendSignedTransaction(signTx.rawTransaction);
      expect(receipt.status).to.true;

      // manager3 发送 approve 交易
      signTx = await config.signTransaction("approve", config.manager3PrivateKey, [proposalName]);
      receipt = await config.web3.platon.sendSignedTransaction(signTx.rawTransaction);
      expect(receipt.status).to.true;

      // manager1 执行多签提案      
      signTx = await config.signTransaction("execute", config.manager1PrivateKey, [proposalName]);
      receipt = await config.web3.platon.sendSignedTransaction(signTx.rawTransaction);
      expect(receipt.status).to.true;
    });
  });

  describe('get_managers', () => {
    const managers = [config.manager2Address, config.manager3Address, config.manager1Address];
    it("Multisig managers should equal " + managers, () => {
      return config.contract.methods.get_managers().call(null, (error, result) => {
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
  let from = config.web3.platon.accounts.privateKeyToAccount(privateKey).address; // 私钥导出公钥
  let nonce = config.web3.utils.numberToHex(await config.web3.platon.getTransactionCount(from)); // 获取 生成 nonce
  let data = config.contract.methods[actionName].apply(config.contract.methods, paramsArray).encodeABI(); // encode ABI
  // 准备交易数据
  let tx = {
    from: from,
    to: config.contractAddress,
    value: 0,
    chainId: 210309,
    data: data,
    nonce: nonce,
    gas: "2000000"
  };

  // 签名交易
  let signTx = await config.web3.platon.accounts.signTransaction(tx, privateKey);
  return signTx;
}