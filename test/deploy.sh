#! /bin/bash

platon-truffle compile
platon attach http://192.168.1.65:6789 -exec 'personal.unlockAccount("lat15nqll7dfn4km00lz6nd4ahxya5gals9d2f7sn8", "lyq20475", 24*3600)'
receipt=`platon-truffle deploy --wasm --contract-name multisig --params '[["lat1q949tup3qkgdvu223qu5yyee4knhfchp40lpgh","lat17jemcasgq2vdq0urysvldn84q7dxe3ekrlhf39","lat182966a4jv369w9wss6lqk07wlxagv84tjmk87z"], 2]'`
pos=${receipt#*contractAddress: \'}
CONSTRACT_FILE="contractAddress.js"
if [ ! -f "$CONSTRACT_FILE" ]; then
  touch "$CONSTRACT_FILE"
else 
  rm -f "$CONSTRACT_FILE"
fi
echo "module.exports = \"${pos:0:42}\"" > $CONSTRACT_FILE