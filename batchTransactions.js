// batchTransactions.js
// A simple program for batching Ethereum transactions using ethers.js v6
// Supports ETH and ERC-20 tokens with gas estimation
// Modified to work with SimpleMultiSend contract

const ethers = require('ethers');
const { MULTISEND_CONTRACT_ABI, ERC20_ABI } = require('./abis');

// Initialize Ethereum provider, signer, and batch contract
const initializeConnection = async (config) => {
  if (!config.multiSendContractAddress) {
    throw new Error('MultiSend contract address is required');
  }

  let provider;
  let signer;
  
  // Check if we're in browser with ethereum provider
  const hasWindowEthereum = typeof window !== 'undefined' && window?.ethereum;
  
  // Create provider based on available options
  if (hasWindowEthereum) {
    // Browser with MetaMask or similar wallet
    provider = new ethers.BrowserProvider(window.ethereum);
    // In v6, getting a signer is asynchronous
    signer = await provider.getSigner();
  } else {
    // No window.ethereum, use RPC URL instead
    if (!config.providerUrl) {
      throw new Error('Provider URL is required when window.ethereum is not available');
    }
    
    provider = new ethers.JsonRpcProvider(config.providerUrl);
    
    // In this case, we need a private key to sign transactions
    if (!config.privateKey) {
      throw new Error('Private key is required when window.ethereum is not available');
    }
    
    signer = new ethers.Wallet(config.privateKey, provider);
  }

  // Create the contract instance
  const multiSendContract = new ethers.Contract(
    config.multiSendContractAddress,
    config.multiSendContractAbi || MULTISEND_CONTRACT_ABI,
    signer
  );

  return { provider, signer, multiSendContract };
};

// Create a transaction batch manager
const createBatchManager = (config) => {
  // For ethers v6, we need to initialize asynchronously, but we can't do that in the 
  // createBatchManager function directly. Instead, we'll initialize later when needed.
  let connection = null;
  
  // Group by type (eth/erc20) and token
  const transactionGroups = {
    eth: [], // Array of {to, value} objects
    erc20: {} // Mapping of tokenAddress -> [{to, value, decimals}]
  };

  // Initialize connection asynchronously
  const getConnection = async () => {
    if (!connection) {
      connection = await initializeConnection(config);
    }
    return connection;
  };

  // Add an ETH transfer transaction to the batch
  const addEthTransaction = (to, value, data = '0x') => {
    if (!ethers.isAddress(to)) {
      throw new Error(`Invalid recipient address: ${to}`);
    }

    try {
      const valueInWei = ethers.parseEther(value.toString());
      
      transactionGroups.eth.push({
        to,
        value: valueInWei
      });
      
      return true;
    } catch (error) {
      throw new Error(`Error adding ETH transaction: ${error.message}`);
    }
  };

  // Add an ERC-20 token transfer transaction to the batch
  const addErc20Transaction = (tokenAddress, to, value, decimals = 18) => {
    if (!ethers.isAddress(tokenAddress)) {
      throw new Error(`Invalid token address: ${tokenAddress}`);
    }

    if (!ethers.isAddress(to)) {
      throw new Error(`Invalid recipient address: ${to}`);
    }

    try {
      // Initialize token group if it doesn't exist
      if (!transactionGroups.erc20[tokenAddress]) {
        transactionGroups.erc20[tokenAddress] = [];
      }
      
      // Convert value to correct decimal places
      const valueWithDecimals = ethers.parseUnits(value.toString(), decimals);
      
      // Add to the appropriate token group
      transactionGroups.erc20[tokenAddress].push({
        to,
        value: valueWithDecimals,
        decimals
      });
      
      return true;
    } catch (error) {
      throw new Error(`Error adding ERC-20 transaction: ${error.message}`);
    }
  };

  // Clear all pending transactions from the batch
  const clearTransactions = () => {
    transactionGroups.eth = [];
    transactionGroups.erc20 = {};
    return true;
  };

  // Get the current status of the batch
  const getBatchStatus = () => {
    // Count ETH transactions
    const ethCount = transactionGroups.eth.length;
    
    // Count ERC20 transactions and recipients
    let erc20Count = 0;
    let uniqueRecipients = new Set();
    let totalEthValue = BigInt(0);
    
    // Add ETH recipients to the set
    for (const tx of transactionGroups.eth) {
      uniqueRecipients.add(tx.to);
      totalEthValue += BigInt(tx.value.toString());
    }
    
    // Add ERC20 recipients to the set and count transactions
    for (const tokenAddress in transactionGroups.erc20) {
      const tokenTxs = transactionGroups.erc20[tokenAddress];
      erc20Count += tokenTxs.length;
      
      for (const tx of tokenTxs) {
        uniqueRecipients.add(tx.to);
      }
    }
    
    return {
      totalTransactions: ethCount + erc20Count,
      ethTransactions: ethCount,
      erc20Transactions: erc20Count,
      erc20TokenCount: Object.keys(transactionGroups.erc20).length,
      totalEthValue: ethers.formatEther(totalEthValue),
      uniqueRecipients: uniqueRecipients.size
    };
  };

  // Helper function to check token balance and approve spending if needed
  const checkAndApproveToken = async (tokenAddress, tokenTxs) => {
    const { signer, multiSendContract } = await getConnection();
    
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      signer
    );
    
    // Calculate total amount needed
    const totalAmount = tokenTxs.reduce(
      (sum, tx) => sum + BigInt(tx.value.toString()),
      BigInt(0)
    );
    
    // Get signer address
    const signerAddress = await signer.getAddress();
    
    // Check balance
    const balance = await tokenContract.balanceOf(signerAddress);
    if (balance < totalAmount) {
      throw new Error(`Insufficient ${tokenAddress} token balance`);
    }
    
    // Check allowance
    const allowance = await tokenContract.allowance(
      signerAddress, 
      await multiSendContract.getAddress()
    );
    
    // Approve if needed
    if (allowance < totalAmount) {
      console.log(`Approving ${tokenAddress} for spending...`);
      const approveTx = await tokenContract.approve(
        await multiSendContract.getAddress(),
        totalAmount
      );
      
      console.log(`Approval transaction submitted: ${approveTx.hash}`);
      await approveTx.wait();
      console.log('Approval confirmed');
    }
    
    return true;
  };

  // Estimate the gas required for the batch transactions
  const estimateGas = async (options = {}) => {
    const { provider, multiSendContract } = await getConnection();
    
    const results = {
      ethTransactions: 0,
      erc20Transactions: 0,
      totalTransactions: 0,
      gasEstimates: {}
    };
    
    // Get total transaction count
    results.ethTransactions = transactionGroups.eth.length;
    
    let erc20Count = 0;
    for (const tokenAddress in transactionGroups.erc20) {
      erc20Count += transactionGroups.erc20[tokenAddress].length;
    }
    results.erc20Transactions = erc20Count;
    results.totalTransactions = results.ethTransactions + results.erc20Transactions;
    
    if (results.totalTransactions === 0) {
      throw new Error('No transactions to estimate gas for');
    }
    
    // Get current gas price if not provided
    const gasPrice = options.gasPrice 
      ? BigInt(options.gasPrice)
      : await provider.getFeeData().then(fees => fees.gasPrice || BigInt(0));
    
    results.gasPrice = gasPrice.toString();
    
    try {
      // Estimate gas for ETH transactions if any
      if (transactionGroups.eth.length > 0) {
        const recipients = transactionGroups.eth.map(tx => tx.to);
        const amounts = transactionGroups.eth.map(tx => tx.value);
        
        // Calculate total ETH value
        const totalValue = amounts.reduce(
          (sum, value) => sum + BigInt(value.toString()),
          BigInt(0)
        );
        
        // Estimate gas
        const ethGasEstimate = await multiSendContract.multiSendETH.estimateGas(
          recipients,
          amounts,
          { value: totalValue }
        );
        
        // Add buffer (10%)
        const ethGasWithBuffer = (ethGasEstimate * BigInt(110)) / BigInt(100);
        
        results.gasEstimates.eth = {
          gasEstimate: ethGasEstimate.toString(),
          gasWithBuffer: ethGasWithBuffer.toString(),
          totalValue: ethers.formatEther(totalValue)
        };
      }
      
      // Simplified version for example.js
      return results;
    } catch (error) {
      throw new Error(`Gas estimation failed: ${error.message}`);
    }
  };

  // Check ERC20 balances
  const checkErc20Balances = async () => {
    const { signer } = await getConnection();
    const signerAddress = await signer.getAddress();
    
    const results = {};
    
    for (const tokenAddress in transactionGroups.erc20) {
      const tokenTxs = transactionGroups.erc20[tokenAddress];
      
      if (tokenTxs.length > 0) {
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ERC20_ABI,
          signer
        );
        
        // Calculate total amount needed
        const totalAmount = tokenTxs.reduce(
          (sum, tx) => sum + BigInt(tx.value.toString()),
          BigInt(0)
        );
        
        // Get decimals
        let decimals = tokenTxs[0].decimals;
        try {
          decimals = await tokenContract.decimals();
        } catch (e) {
          // Use provided decimals if function not available
        }
        
        // Check balance
        const balance = await tokenContract.balanceOf(signerAddress);
        
        results[tokenAddress] = {
          address: tokenAddress,
          balance: balance.toString(),
          balanceFormatted: ethers.formatUnits(balance, decimals),
          required: totalAmount.toString(),
          requiredFormatted: ethers.formatUnits(totalAmount, decimals),
          sufficient: balance >= totalAmount,
          recipients: tokenTxs.length
        };
      }
    }
    
    return results;
  };

  // Send all batch transactions
  const sendBatchTransaction = async (options = {}) => {
    const { provider, signer, multiSendContract } = await getConnection();
    
    const results = {
      ethTransaction: null,
      erc20Transactions: {},
      totalTransactions: 0
    };
    
    // Count total transactions
    results.totalTransactions = transactionGroups.eth.length;
    
    for (const tokenAddress in transactionGroups.erc20) {
      results.totalTransactions += transactionGroups.erc20[tokenAddress].length;
    }
    
    if (results.totalTransactions === 0) {
      throw new Error('No transactions to send');
    }
    
    try {
      // Send ETH transactions if any
      if (transactionGroups.eth.length > 0) {
        const recipients = transactionGroups.eth.map(tx => tx.to);
        const amounts = transactionGroups.eth.map(tx => tx.value);
        
        // Calculate total ETH value
        const totalValue = amounts.reduce(
          (sum, value) => sum + BigInt(value.toString()),
          BigInt(0)
        );
        
        // Estimate gas if not provided
        let gasLimit;
        if (options.ethGasLimit) {
          gasLimit = BigInt(options.ethGasLimit);
        } else {
          const ethGasEstimate = await multiSendContract.multiSendETH.estimateGas(
            recipients,
            amounts,
            { value: totalValue }
          );
          gasLimit = (ethGasEstimate * BigInt(110)) / BigInt(100); // 10% buffer
        }
        
        // Prepare transaction options
        const txOptions = {
          value: totalValue,
          gasLimit
        };
        
        // Add gasPrice if provided
        if (options.gasPrice) {
          txOptions.gasPrice = BigInt(options.gasPrice);
        }
        
        // Send transaction
        console.log(`Sending ETH batch transaction to ${recipients.length} recipients with total value ${ethers.formatEther(totalValue)} ETH`);
        const ethTx = await multiSendContract.multiSendETH(
          recipients,
          amounts,
          txOptions
        );
        
        // Wait for confirmation
        console.log(`ETH transaction submitted: ${ethTx.hash}`);
        const ethReceipt = await ethTx.wait();
        
        results.ethTransaction = {
          transactionHash: ethReceipt.hash,
          blockNumber: ethReceipt.blockNumber,
          gasUsed: ethReceipt.gasUsed.toString(),
          status: ethReceipt.status === 1 ? 'success' : 'failed',
          recipients: recipients.length
        };
      }
      
      // Send ERC20 transactions for each token
      for (const tokenAddress in transactionGroups.erc20) {
        const tokenTxs = transactionGroups.erc20[tokenAddress];
        
        if (tokenTxs.length > 0) {
          // First check and approve tokens if needed
          await checkAndApproveToken(tokenAddress, tokenTxs);
          
          const recipients = tokenTxs.map(tx => tx.to);
          const amounts = tokenTxs.map(tx => tx.value);
          
          // Estimate gas if not provided
          let gasLimit;
          if (options.tokenGasLimits && options.tokenGasLimits[tokenAddress]) {
            gasLimit = BigInt(options.tokenGasLimits[tokenAddress]);
          } else {
            const tokenGasEstimate = await multiSendContract.multiSendToken.estimateGas(
              tokenAddress,
              recipients,
              amounts
            );
            gasLimit = (tokenGasEstimate * BigInt(110)) / BigInt(100); // 10% buffer
          }
          
          // Prepare transaction options
          const txOptions = {
            gasLimit
          };
          
          // Add gasPrice if provided
          if (options.gasPrice) {
            txOptions.gasPrice = BigInt(options.gasPrice);
          }
          
          // Send transaction
          console.log(`Sending token ${tokenAddress} batch transaction to ${recipients.length} recipients`);
          const tokenTx = await multiSendContract.multiSendToken(
            tokenAddress,
            recipients,
            amounts,
            txOptions
          );
          
          // Wait for confirmation
          console.log(`Token transaction submitted: ${tokenTx.hash}`);
          const tokenReceipt = await tokenTx.wait();
          
          results.erc20Transactions[tokenAddress] = {
            transactionHash: tokenReceipt.hash,
            blockNumber: tokenReceipt.blockNumber,
            gasUsed: tokenReceipt.gasUsed.toString(),
            status: tokenReceipt.status === 1 ? 'success' : 'failed',
            recipients: recipients.length
          };
        }
      }
      
      return results;
    } catch (error) {
      throw new Error(`Failed to send batch transaction: ${error.message}`);
    }
  };

  // Return the public API
  return {
    addEthTransaction,
    addErc20Transaction,
    clearTransactions,
    getBatchStatus,
    estimateGas,
    checkErc20Balances,
    sendBatchTransaction  // Added sendBatchTransaction to the API
  };
};

module.exports = {
  createBatchManager
};