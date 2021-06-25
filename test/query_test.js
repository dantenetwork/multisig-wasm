/*
 * @Description: 
 * @Author: kay
 * @Date: 2021-06-23 17:19:25
 * @LastEditTime: 2021-06-24 17:58:50
 * @LastEditors: kay
 */
const chai = require('chai');
const expect = chai.expect;
const config = require('./config');

// 合约的查询接口
describe('Multisig Test of Query', () => {
  // 验证智能合约 requires
  describe('Query requires', () => {
    const requires = 2;
    it("Multisig requires should equal " + requires, () => {
      return config.contract.methods.get_requires().call(null, (error, result) => {
        expect(result).to.equal(requires);
      });
    });
  });

  // 验证多签合约 managers
  describe('Query managers', () => {
    const managers = [config.manager2Address, config.manager3Address, config.manager1Address];
    it("Multisig managers should equal " + managers, () => {
      return config.contract.methods.get_managers().call(null, (error, result) => {
        for (let i in result) {
          expect(result[i]).to.equal(managers[i]);
        }
      });
    });
  });

    // 获取多签提案内容
  describe('Query proposals', () => {
      it("Multisig managers should equal ", () => {
        return config.contract.methods.get_proposal(config.expiredProposalName).call(null, (error, result) => {
          console.log(result)
        });
      });
  });
});