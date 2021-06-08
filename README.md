<!--
 * @Description: 
 * @Author: kay
 * @Date: 2021-06-04 10:54:13
 * @LastEditTime: 2021-06-08 11:50:08
 * @LastEditors: kay
-->

# Multisig contract

## Compile contract

```sh
platon-truffle compile
```

## Deploy contract

### unlock wallet

```sh
platon-truffle console
web3.platon.personal.unlockAccount(address, passwords)
```

### deploy contract

```sh
platon-truffle deploy --wasm --contract-name multisig --params '[[Manager1_Address, Manager2_Address, ....], Requires]'

e.g
platon-truffle deploy --wasm --contract-name multisig --params '[["lat1q949tup3qkgdvu223qu5yyee4knhfchp40lpgh","lat17jemcasgq2vdq0urysvldn84q7dxe3ekrlhf39","lat182966a4jv369w9wss6lqk07wlxagv84tjmk87z"], 2]'
```

params:

- managers: multisig manager's address

- requires: requires minimum mangers

## Usage

Creating constract object

```js
var abi = "";               // multisig.abi.json
var contractAddr = "";      // multisig contract address
var multisig = new web3.platon.Contract(abi,contractAddr,{vmType: 1 });
```

### Propose a transfer proposal

```js
multisig.methods.propose(proposal_name, contract_addr, to, amount, expiration).send({
    from: sender,gas: 999999
}).on('receipt', function(receipt) {
    console.log(receipt);
}).on('error', console.error);
```

only managers can propose a proposal.

propose params:

- **proposal_name**: Transfer proposal name

- **contract_addr**: PRC20Address, if transfer `LAT` contract_addr = "lat1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq542u6a"

- **to**: Address for token receipts

- **amount**: Transfer amount

- **expiration(ms)**: After `expiration(ms)` this proposal will be unvalid, if `expiration <= 0` default one day.

### Approve proposal

#### Check proposal information

```js
multisig.methods.get_proposal(proposal_name).call(console.log)

e.g:
[
  'lat1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq542u6a',     // PRC20Address, "lat1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq542u6a" means transfer LAT token
  'lat15nqll7dfn4km00lz6nd4ahxya5gals9d2f7sn8',     // to address
  '100000000000000',                                // transfer amount
  '1623061218155'                                   // expiration time
]
```

##### Approve

Only manager can approve proposal

```js
multisig.methods.approve(proposal_name).send({
    from: sender, gas: 999999
}).on('receipt', function(receipt) {
    console.log(receipt);
}).on('error', console.error);
```

## Execute proposal

1、Check approve information

```js
multisig.methods.get_approval(proposal_name).call(console.log)

e.g:
[
  'lat1q949tup3qkgdvu223qu5yyee4knhfchp40lpgh',       // approve manager address
  'lat17jemcasgq2vdq0urysvldn84q7dxe3ekrlhf39',
]
```

Only the number of proposer more than `requires`, anyone can execute proposal.

2、Execute

```js
multisig.methods.execute(proposal_name).send({
    from: sender, gas: 999999
}).on('receipt', function(receipt) {
    console.log(receipt);
}).on('error', console.error);
```

## Add or remove managers

### Propose proposal

```js
// add managers proposal
multisig.methods.add_managers(proposal_name, [new_manager1, new_manager2,...], new_requires).send({
    from: sender, gas: 999999
}).on('receipt', function(receipt) {
    console.log(receipt);
}).on('error', console.error);

// remove managers proposal
multisig.methods.remove_managers(proposal_name, [old_manager1, old_manager2, ...], new_requires).send({
    from: sender, gas: 999999
}).on('receipt', function(receipt) {
    console.log(receipt);
}).on('error', console.error);
```

propose params:

- **proposal_name**: add or remove proposal name

- **managers**: Array list of add or remove managers

- **new_requires**: new minimum requires

### Approve add managers proposal

1、Check proposal

```js
multisig.methods.get_update_managers_proposal(proposal_name).call(console.log)

e.g:
[
  ["lat1c9s7qxxljhh2rhy48njr0pluxw960f6ge0lyj7"],       // add or remove manager's address
  [],                                                   // approved managers
  1,                                                    // action_type, 0 delete managers, 1 add manager
  2,                                                    // new requires
]
```

2、Approve

see [Approve proposal](####approve)

### Execute

see [Exectue proposal](##Execute-proposal)

## Test Case

[Multisig WSAM constract Test](test/README.md)