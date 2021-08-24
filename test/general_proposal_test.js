/*
 * @Description: 
 * @Author: kay
 * @Date: 2021-06-22 16:25:12
 * @LastEditTime: 2021-08-24 16:27:22
 * @LastEditors: kay
 */

const chai = require('chai');
const expect = chai.expect;

const config = require('./config');

// 合约的执行接口
describe('Multisig Action Test of Call Other Contract Cases', () => {
  // 测试 manager 账户发起多签提案
  const proposalName = "transfer";
  const expireTime = 0;
  describe('Propose call other contract proposal', async() => {
    it("Transaction status should equal true", async function () {
      this.timeout(0);
      // transfer one prc20 token to owner;
      let ONETOKEN = "1000000000000000000";
      let transferParas = config.erc20Contract.methods.transfer(config.ownerAddress, ONETOKEN).encodeABI();
      let transferParasBytes = config.web3.utils.hexToBytes(transferParas);
      const signTx = await config.signTransaction("propose", config.manager1PrivateKey, [proposalName, config.erc20Address, transferParasBytes, expireTime]);

      // 发送交易
      const receipt = await config.web3.platon.sendSignedTransaction(signTx.rawTransaction);
      console.log("transaction id: " + receipt.transactionHash, ", transaction status: " + receipt.status);
      expect(receipt.status).to.true;
    });
  });

  // 测试非管理员账户批准多签提案
  describe('Approve by non manager', async() => {
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
  describe('Approve call other contract', () => {
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
  describe('Execute call other contract', () => {
    it("Execute proposal " + proposalName + ", status should equal true", async function () {
      this.timeout(0);
      const signTx = await config.signTransaction("execute", config.manager1PrivateKey, [proposalName]);

      // 发送交易
      const receipt = await config.web3.platon.sendSignedTransaction(signTx.rawTransaction);
      console.log("transaction id: " + receipt.transactionHash, ", transaction status: " + receipt.status);
      expect(receipt.status).to.true;
    });
  });

  // 测试 manager approve 提案
  describe('Approve expired proposal', () => {
    before(async function () {
      config.contract.methods.get_proposal(config.expiredProposalName).call((error, result) => {
        if (!result || parseInt(result[1][0]) == 0) {
          (async () => {
            const signTx = await config.signTransaction("propose_transfer", config.manager1PrivateKey, [config.expiredProposalName, config.ownerAddress, config.TOKEN, 1]);
            const receipt = await config.web3.platon.sendSignedTransaction(signTx.rawTransaction);
            console.log("transaction id: " + receipt.transactionHash, ", transaction status: " + receipt.status);
          })();
        }
      });
    });

    it("Approve " + config.expiredProposalName + ", status should equal true", async function () {
      this.timeout(0);
      // manager2 发送 approve 交易
      let signTx = await config.signTransaction("approve", config.manager2PrivateKey, [config.expiredProposalName]);
      try {
        await config.web3.platon.sendSignedTransaction(signTx.rawTransaction);
        expect(1).to.equal(0);
      } catch (error) {
        console.log("transaction id: " + error.receipt.transactionHash, ", transaction status: " + error.receipt.status);
        expect(error).to.an("Error");
      }
    });
  });

});
