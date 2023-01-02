require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.16",
  networks:{
    goerli:{
      url: process.env.GOERLI_API,
      accounts: [process.env.ACCOUNT_KEY]
    },
    mumbai:{
      url: process.env.MUMBAI_API,
      accounts: [process.env.ACCOUNT_KEY]
    }
  }
};