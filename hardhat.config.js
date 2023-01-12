require('dotenv').config()

if (process.env.TEST_NETWORK == "hh"){
  hhConfig();
} else if (process.env.TEST_NETWORK == "zkSync"){
  zkSyncConfig();
}


function hhConfig() {
  require("@nomiclabs/hardhat-waffle");
  require("@nomiclabs/hardhat-web3");


  module.exports = {
    defaultNetwork: "hardhat",
    networks: {
      hardhat: {
        allowUnlimitedContractSize: false,
        chainId: 1,
        mining: {
          auto: true,
          interval: 0
        }
      }
      // ,
      // goerli: {
      //   url: process.env.goerli_provider,
      //   accounts: [ process.env.goerli_owner_pvk, process.env.goerli_nonOwner_pvk, process.env.goerli_fundRecipient_pvk ]
      // }
    },
    solidity: {
      compilers: [
        {
          version: "0.8.16",
          settings: {
            optimizer: {
              enabled: true,
              runs: 200
            }
          }
        },
      ]
    },
    paths: {
      sources: `./contracts/`,
      tests: `./test`,
      cache: `./cache`,
      artifacts: `./artifacts`
    },
    mocha: {
      timeout: 400000
    }
  }
}


function zkSyncConfig() {
  const { HardhatUserConfig } = require('hardhat/config');

  require("@matterlabs/hardhat-zksync-deploy");
  require("@matterlabs/hardhat-zksync-solc");

  // dynamically changes endpoints for local tests
  const zkSyncTestnet =
    process.env.NODE_ENV == "test"
      ? {
          url: "http://localhost:3050",
          ethNetwork: "http://localhost:8545",
          zksync: true,
        }
      : {
          url: "https://zksync2-testnet.zksync.dev",
          ethNetwork: "goerli",
          zksync: true,
        };

  module.exports = {
    zksolc: {
      version: "1.2.1",
      compilerSource: "binary",
      settings: {
        experimental: {
          dockerImage: "matterlabs/zksolc",
          tag: "v1.2.1",
        },
      },
    },
    // defaults to zkSync network
    defaultNetwork: "zkSyncTestnet",

    networks: {
      hardhat: {
        zksync: true,
      },
      // load test network details
      zkSyncTestnet
    },
    solidity: {
      version: "0.8.16",
      settings: {
      optimizer: {
          enabled: true,
          runs: 200
        }
      }
    },
  };
}
