module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
    networks: {
        development: {
            host: "127.0.0.1",
            port: 9545, //7545
            network_id: "*"
        }
    },
    compilers: {
        solc: {
            version: "^0.5.2" // A version or constraint - Ex. "^0.5.0"
                                 // Can also be set to "native" to use a native solc
        }
    }
};
