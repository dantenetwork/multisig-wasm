/*
 * @Description: 
 * @Author: kay
 * @Date: 2021-06-22 17:19:27
 * @LastEditTime: 2021-06-23 17:29:23
 * @LastEditors: kay
 */
const chai = require('chai');
const expect = chai.expect;
const config = require('./config_test');

// Token 转账
(async () => {
  let balance = await config.web3.platon.getBalance(config.contractAddress);
  if (parseInt(balance) <= parseInt(config.TOKEN)) {
    let nonce = config.web3.utils.numberToHex(await config.web3.platon.getTransactionCount(config.ownerAddress)); // 获取 生成 nonce

    let tx = {
      from: config.ownerAddress,
      to: config.contractAddress,
      value: config.TOKEN,
      chainId: 210309,
      nonce: nonce,
      gas: "2000000"
    };
    // 签名交易
    let signTx = await config.web3.platon.accounts.signTransaction(tx, config.ownerPrivateKey);
    const receipt = await config.web3.platon.sendSignedTransaction(signTx.rawTransaction);
    console.log(receipt)
  }
})();

// 合约的执行接口
describe('Multisig Action Test of Transfer LAT Cases', () => {
  // 测试 manager 账户发起多签提案
  const proposalName = "TransferLAT";
  describe('Propose Transfer LAT proposal', () => {
    it("Transaction status should equal true", async function () {
      this.timeout(0);
      let expireTime = -1; // if <= 0, default expiration time: one day.
      const signTx = await config.signTransaction("propose_transfer", config.manager1PrivateKey, [proposalName, config.ownerAddress, config.TOKEN, expireTime]);

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
  describe('Approve Transfser LAT', () => {
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
  describe('Execute Transfer LAT', () => {
    it("Execute proposal " + proposalName + ", status should equal true", async function () {
      const startBalance = parseInt(await config.web3.platon.getBalance(config.contractAddress));
      this.timeout(0);
      const signTx = await config.signTransaction("execute", config.manager1PrivateKey, [proposalName]);

      // 发送交易
      const receipt = await config.web3.platon.sendSignedTransaction(signTx.rawTransaction);
      console.log("transaction id: " + receipt.transactionHash, ", transaction status: " + receipt.status);
      expect(receipt.status).to.true;
      const afterExecuteBalance = parseInt(await config.web3.platon.getBalance(config.contractAddress));
      console.log("startBalance: ", startBalance, "afterExecuteBalance:", afterExecuteBalance);
      expect(afterExecuteBalance).to.equals(startBalance - config.TOKEN);
    });
  });

});