<!--
 * @Description: 
 * @Author: kay
 * @Date: 2021-06-04 10:54:13
 * @LastEditTime: 2021-06-25 14:23:01
 * @LastEditors: kay
-->

# Multisig contract

## Compile contract

```sh
platon-truffle compile
```

## Deploy contract

### deploy contract

1、unlock wallet

```sh
platon-truffle console
web3.platon.personal.unlockAccount(address, passwords)
```

2、deploy

```sh
platon-truffle deploy --wasm --contract-name multisig --params '[[Manager1_Address, Manager2_Address, ....], Requires]'

e.g
platon-truffle deploy --wasm --contract-name multisig --params '[["lat1q949tup3qkgdvu223qu5yyee4knhfchp40lpgh","lat17jemcasgq2vdq0urysvldn84q7dxe3ekrlhf39","lat182966a4jv369w9wss6lqk07wlxagv84tjmk87z"], 2]'
```

params:

- managers: multisig manager's address

- requires: requires minimum mangers

or run the [deploy.js](test/deploy.js) script to deploy the contract.

## Usage

Creating constract object

```js
var abi = "";               // multisig.abi.json
var contractAddr = "";      // multisig contract address
var multisig = new web3.platon.Contract(abi,contractAddr,{vmType: 1 });
```

Only managers can call multisig contract.

### Propose call other contract proposal

```js
multisig.methods.propose(PROPOSAL_NAME, CONTRACT_ADDRESS, PARAMETERS_BYTES, EXPIRATION).send({
    from: sender, gas: 999999
}).on('receipt', function(receipt) {
    console.log(receipt);
}).on('error', console.error);
```

propose params:

- **PROPOSAL_NAME**: Transfer proposal name.

- **CONTRACT_ADDRESS**: Other contract address.

- **PARAMETERS_BYTES**: The encoded ABI byte code to send via a transaction or call.

- **EXPIRATION(ms)**: After `EXPIRATION(ms)` this proposal will be unvalid, if `expiration <= 0` default one day.

### Propose transfer LAT proposal

```js
multisig.methods.propose_transfer(PROPOSAL_NAME, TO, AMOUNT, EXPIRATION).send({
    from: sender, gas: 999999
}).on('receipt', function(receipt) {
    console.log(receipt);
}).on('error', console.error);
```

propose params:

- **PROPOSAL_NAME**: Transfer LAT proposal name.

- **TO**: Receipt address.

- **AMOUNT**: transfer amount.

- **EXPIRATION(ms)**: After `EXPIRATION(ms)` this proposal will be unvalid, if `expiration <= 0` default one day.

### Propose update managers proposal

```js
multisig.methods.propose_update_managers(PROPOSAL_NAME, [MANAGER1, MANAGER2,...], REQUIRES, EXPIRATION).send({
    from: sender, gas: 999999
}).on('receipt', function(receipt) {
    console.log(receipt);
}).on('error', console.error);
```

- **PROPOSAL_NAME**: update managers proposal name

- **MANAGERS**: Array list of new managers

- **REQUIRES**: New minimum requires

- **EXPIRATION(ms)**: After `EXPIRATION(ms)` this proposal will be unvalid, if `expiration <= 0` default one day.

### Approve proposal

#### Check proposal information

```js
multisig.methods.get_proposal(proposal_name).call(console.log)
```

return an array of `Porposal` type

```js
[
    GeneralProposal,
    TransferProposal,
    UpdateManagersProposal
]
```

```c++
struct GeneralProposal {
  int64_t expiration;
  Address contract_addr;
  bytes paras;
  std::set<std::string> approvers;
};

struct TransferProposal {
  int64_t expiration;
  Address to;
  u128 amount;
  std::set<std::string> approvers;
};

struct UpdateManagersProposal {
  uint8_t requires;
  int64_t expiration;
  std::set<std::string> managers;
  std::set<std::string> approvers;
};
```

#### Approve

Only manager can approve proposal

```js
multisig.methods.approve(proposal_name).send({
    from: sender, gas: 999999
}).on('receipt', function(receipt) {
    console.log(receipt);
}).on('error', console.error);
```

## Execute proposal

Only the number of proposer more than `requires`, and one of manager can execute proposal.

```js
multisig.methods.execute(proposal_name).send({
    from: sender, gas: 999999
}).on('receipt', function(receipt) {
    console.log(receipt);
}).on('error', console.error);
```

## Test Case

[Multisig WSAM constract Test](test)
