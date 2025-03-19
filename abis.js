const MULTISEND_CONTRACT_ABI = [
    {
      "inputs": [
        {"internalType": "address[]", "name": "recipients", "type": "address[]"},
        {"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}
      ],
      "name": "multiSendETH",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "address", "name": "token", "type": "address"},
        {"internalType": "address[]", "name": "recipients", "type": "address[]"},
        {"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}
      ],
      "name": "multiSendToken",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "address[]", "name": "tokens", "type": "address[]"},
        {"internalType": "address", "name": "recipient", "type": "address"},
        {"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}
      ],
      "name": "multiTokenTransfer",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "anonymous": false,
      "inputs": [
        {"indexed": true, "internalType": "address", "name": "sender", "type": "address"},
        {"indexed": false, "internalType": "address", "name": "tokenAddress", "type": "address"},
        {"indexed": false, "internalType": "uint256", "name": "totalAmount", "type": "uint256"},
        {"indexed": false, "internalType": "uint256", "name": "recipientCount", "type": "uint256"}
      ],
      "name": "MultiSendExecuted",
      "type": "event"
    }
  ];
  
  // Standard ERC-20 token interface ABI (minimal version)
  const ERC20_ABI = [
    {
      "inputs": [
        {"internalType": "address", "name": "recipient", "type": "address"},
        {"internalType": "uint256", "name": "amount", "type": "uint256"}
      ],
      "name": "transfer",
      "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "address", "name": "owner", "type": "address"}
      ],
      "name": "balanceOf",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "address", "name": "spender", "type": "address"},
        {"internalType": "uint256", "name": "amount", "type": "uint256"}
      ],
      "name": "approve",
      "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "address", "name": "owner", "type": "address"},
        {"internalType": "address", "name": "spender", "type": "address"}
      ],
      "name": "allowance",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    }
  ];
  
  module.exports = {
    MULTISEND_CONTRACT_ABI,
    ERC20_ABI
  };