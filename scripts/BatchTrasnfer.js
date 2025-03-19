// deploy.js
const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy BatchTransfer contract
  console.log("Deploying BatchTransfer...");
  
  // Get the contract factory
  const BatchTransfer = await ethers.getContractFactory("BatchTransfer");
  
  // Deploy the contract
  const batchTransfer = await BatchTransfer.deploy();
  
  // Wait for deployment to complete

  const contractAddress = await batchTransfer.getAddress();
  console.log("BatchTransfer deployed to:", contractAddress);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });