require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.27",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    BaseSepolia: {
      url: "https://sepolia.base.org",
      accounts: ["3ef776252726ab9f543bcd4dc0cc3e447a58ac1b0fa6df14ba7cc18a022f7685"],
      chainId: 84532
    },
    Base: {
      url: "https://mainnet.base.org",
      accounts: ["3ef776252726ab9f543bcd4dc0cc3e447a58ac1b0fa6df14ba7cc18a022f7685"],
      chainId: 8453
    },
  },
  etherscan: {
    apiKey: {
      baseSepolia: "RI9IN6M9NKYCUGDDG2RAX3Y7SBBKGCGY7Q",
    },
  },
};

// npx hardhat verify --network arbitrumSepolia 0x7805963f1D3Ea40dB83B9FA6B6EC42Bd970a763A
