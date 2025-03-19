# Ethereum Batch Transaction Program

A simple JavaScript program for batching Ethereum transactions. This program leverages a BatchTransfer smart contract to enable efficient processing of multiple ETH and ERC-20 token transactions in a single batch.

## Deployed Contract

The BatchTransfer contract has been deployed on Base Sepolia at address:

```
0x34d10D1Ab8204d51E5dc5dCc31b6A7B14be697c3
```

You can view the contract on Base Sepolia Explorer: [https://sepolia.basescan.org/address/0x34d10D1Ab8204d51E5dc5dCc31b6A7B14be697c3](https://sepolia.basescan.org/address/0x34d10D1Ab8204d51E5dc5dCc31b6A7B14be697c3)

## Features

- Batch multiple ETH and ERC-20 transactions together
- Estimate gas costs to optimize transaction fees
- Modern ethers.js v6 implementation
- Simple function-based API with no complex class hierarchy
- Support for both ETH and ERC-20 token transfers
- Automatic token approvals
- Compatible with both browser (MetaMask) and Node.js environments

## Setup

1. Install dependencies:

```bash
npm install ethers@6.8.1 dotenv
```

2. Create a `.env` file with your configuration:

```
ETHEREUM_RPC_URL=https://sepolia.base.org
PRIVATE_KEY=your_private_key_here
MULTISEND_CONTRACT_ADDRESS=0x34d10D1Ab8204d51E5dc5dCc31b6A7B14be697c3
```

> **Security Note**: Never commit your `.env` file to version control. Add it to your `.gitignore` file.

## Usage

### Basic Example

```javascript
const { createBatchManager } = require('./batchTransactions');

// Initialize the batch manager
const batchManager = createBatchManager({
  providerUrl: 'https://sepolia.base.org',
  privateKey: 'YOUR_PRIVATE_KEY',
  multiSendContractAddress: '0x34d10D1Ab8204d51E5dc5dCc31b6A7B14be697c3'
});

// Add ETH transactions
batchManager.addEthTransaction('0xRecipientAddress1', '0.1'); // 0.1 ETH
batchManager.addEthTransaction('0xRecipientAddress2', '0.05'); // 0.05 ETH

// Add ERC-20 token transactions
batchManager.addErc20Transaction(
  '0xTokenAddress',
  '0xRecipientAddress3',
  '100', // 100 tokens
  18 // token decimals
);

// Get the current batch status
const status = batchManager.getBatchStatus();
console.log('Current batch status:', status);

// Check ERC-20 balances
const balances = await batchManager.checkErc20Balances();
console.log('ERC-20 balances and requirements:', balances);

// Estimate gas
const gasEstimation = await batchManager.estimateGas();
console.log('Gas estimation:', gasEstimation);

// Send the batch transaction
const receipt = await batchManager.sendBatchTransaction();
console.log('Transaction receipt:', receipt);
```

### Full Example

Check the included `example.js` file for a complete example of all features.

## API Reference

### `createBatchManager(config)`

Creates a new batch manager with the given configuration.

- `config.providerUrl` - URL of the Ethereum provider (required for Node.js)
- `config.privateKey` - Private key for the sender (required for Node.js)
- `config.multiSendContractAddress` - Address of the BatchTransfer contract (required)
- `config.multiSendContractAbi` - ABI of the batching contract (optional)

Returns an object with the following methods:

### `addEthTransaction(to, value, data)`

Adds an ETH transfer transaction to the batch.

- `to` - Recipient address
- `value` - Amount of ETH to send (in ETH, not wei)
- `data` - Additional data for the transaction (optional)

### `addErc20Transaction(tokenAddress, to, value, decimals)`

Adds an ERC-20 token transfer transaction to the batch.

- `tokenAddress` - Address of the ERC-20 token contract
- `to` - Recipient address
- `value` - Amount of tokens to send
- `decimals` - Number of decimals in the token (default: 18)

### `clearTransactions()`

Clears all pending transactions from the batch.

### `getBatchStatus()`

Gets the current status of the batch.
Returns an object with batch status information:

```javascript
{
  totalTransactions: 3,
  ethTransactions: 2,
  erc20Transactions: 1,
  erc20TokenCount: 1,
  totalEthValue: '0.15',
  uniqueRecipients: 3
}
```

### `estimateGas(options)`

Estimates the gas required for the batch transaction.

- `options.gasPrice` - Gas price in wei (optional)

Returns an object with gas estimation details:

```javascript
{
  ethTransactions: 2,
  erc20Transactions: 1,
  totalTransactions: 3,
  gasEstimates: {
    eth: {
      gasEstimate: '96394',
      gasWithBuffer: '106033',
      totalValue: '0.15'
    }
  },
  gasPrice: '20000000000'
}
```

### `checkErc20Balances()`

Checks if all ERC-20 tokens in the batch have sufficient balance.
Returns an object with token balance information:

```javascript
{
  '0xTokenAddress': {
    address: '0xTokenAddress',
    balance: '1000000000000',
    balanceFormatted: '1000.0',
    required: '100000000000',
    requiredFormatted: '100.0',
    sufficient: true,
    recipients: 1
  }
}
```

### `sendBatchTransaction(options)`

Sends the batch transaction.

- `options.ethGasLimit` - Gas limit for ETH transactions (optional)
- `options.tokenGasLimits` - Object mapping token addresses to gas limits (optional)
- `options.gasPrice` - Gas price in wei (optional)

Returns a transaction receipt object:

```javascript
{
  ethTransaction: {
    transactionHash: '0x...',
    blockNumber: 12345678,
    gasUsed: '96000',
    status: 'success',
    recipients: 2
  },
  erc20Transactions: {
    '0xTokenAddress': {
      transactionHash: '0x...',
      blockNumber: 12345679,
      gasUsed: '120000',
      status: 'success',
      recipients: 1
    }
  },
  totalTransactions: 3
}
```

## BatchTransfer Contract

This program works with our custom BatchTransfer contract, which provides the following features:

- Send ETH to multiple recipients in a single transaction
- Send ERC-20 tokens to multiple recipients in a single transaction
- Send multiple different ERC-20 tokens to a single recipient

The contract source code is included in the repository as `BatchTransfer.sol`.

## Environment Support

The program is designed to work in both environments:

1. **Browser Environment** - When using in a web application, it will automatically detect and use the user's connected wallet (like MetaMask)

2. **Node.js Environment** - When using in a Node.js script, it will use the provided RPC URL and private key

## Gas Optimization

The program automatically adds a 10% buffer to gas estimations to ensure transactions don't fail due to gas limitations. You can override this by providing custom gas limits in the options.

## Security Considerations

- Always handle private keys securely
- Be cautious with ERC-20 approvals, especially when using large amounts
- Test thoroughly on testnets before using on mainnet
- Validate all addresses and amounts before sending transactions
- Use environment variables for sensitive information
