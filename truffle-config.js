module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
    networks: {
        development: {
            host: "127.0.0.1",
            port: 8545, //7545 truffle dev,  8545 ganache-cli, 9545 ganache-gui
            network_id: "*",
            //gas: 7900000//default is 4712388, raised for testing
        }
    },
    compilers: {
        solc: {
            version: "^0.5.2", // A version or constraint - Ex. "^0.5.0"
                                 // Can also be set to "native" to use a native solc
            optimizer: {  // enable optimization as test, 200 runs is obviously not the right choice
                enabled: true,
                runs: 2000
            }
        }

    }
};
