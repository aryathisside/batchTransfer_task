// example.js
// Example usage of the SimpleMultiSend batch transaction program
require('dotenv').config(); // Load environment variables from .env file
const { createBatchManager } = require('./batchTransactions');

// Main function to run the example
const runExample = async () => {
  try {
    console.log('Starting Ethereum batch transaction example...');
    
    // Create a batch manager with configuration - note the change from batchContractAddress to multiSendContractAddress
    const batchManager = createBatchManager({
      providerUrl: process.env.ETHEREUM_RPC_URL,
      privateKey: process.env.PRIVATE_KEY,
      multiSendContractAddress: process.env.MULTISEND_CONTRACT_ADDRESS // Updated parameter name
    });
    
    console.log('Batch manager created successfully');
    
    // Add some ETH transactions
    batchManager.addEthTransaction('0xe5c9D14D4d59CE293F3b5562c7CA7E19b0164Df5', '0.00001');
    batchManager.addEthTransaction('0xad57aAcad13d86Daa8aD55f0e18B1b62377c0496', '0.00005');
    console.log('Added ETH transactions');
    
    // Add some ERC-20 transactions
    // Example USDC address on Ethereum mainnet
    const USDC_ADDRESS = '0x132aAd982184489d78420756785f9a395c14dd15';
    batchManager.addErc20Transaction(
      USDC_ADDRESS,
      '0xad57aAcad13d86Daa8aD55f0e18B1b62377c0496',
      '100',  // 100 USDC
      6     // USDC has 6 decimals
    );
    console.log('Added ERC-20 transaction');
    
    // Get the current batch status
    const status = batchManager.getBatchStatus();
    console.log('Current batch status:', status);
    
    // Check ERC-20 balances - function name changed from checkErc20Allowances to checkErc20Balances
    const balances = await batchManager.checkErc20Balances();
    console.log('ERC-20 balances and requirements:', balances);
    
    // Approve tokens if needed (uncomment to actually approve)
    for (const tokenAddress in balances) {
      const tokenInfo = balances[tokenAddress];
      if (!tokenInfo.sufficient) {
        console.log(`Insufficient balance for token ${tokenInfo.address}`);
        console.log(`Required: ${tokenInfo.requiredFormatted}, Available: ${tokenInfo.balanceFormatted}`);
      } else {
        console.log(`Sufficient balance for token ${tokenInfo.address}`);
        console.log(`Required: ${tokenInfo.requiredFormatted}, Available: ${tokenInfo.balanceFormatted}`);
      }
    }
    
    // Estimate gas for the batch
    const gasEstimation = await batchManager.estimateGas();
    console.log('Gas estimation:', gasEstimation);
    
    // Showing how to use the separate transaction groups
    console.log(`Will send ${gasEstimation.ethTransactions} ETH transactions`);
    console.log(`Will send ${gasEstimation.erc20Transactions} ERC-20 transactions`);
    
    if (gasEstimation.gasEstimates.eth) {
      console.log(`ETH batch will cost approximately: ${gasEstimation.gasEstimates.eth.totalValue} ETH`);
    }
    
    // Ask for confirmation before sending transactions
    console.log('\nReady to send transactions. Press Ctrl+C to cancel or wait 5 seconds to proceed...');
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
    
    // Send the batch transaction
    console.log('\nSending transactions...');
    const receipt = await batchManager.sendBatchTransaction();
    console.log('Transaction sent! Receipt:', receipt);
    
    // The receipt now has separate entries for ETH and each token
    if (receipt.ethTransaction) {
      console.log(`ETH batch completed: ${receipt.ethTransaction.transactionHash}`);
    }
    
    for (const tokenAddress in receipt.erc20Transactions) {
      console.log(`Token ${tokenAddress} batch completed: ${receipt.erc20Transactions[tokenAddress].transactionHash}`);
    }
    
    console.log('Example completed successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  }
};

// Run the example
runExample()
  .then(() => console.log('Done!'))
  .catch((error) => console.error('Unhandled error:', error));