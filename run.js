var MetaCoin = artifacts.require("./contracts/MetaCoin.sol");

module.exports = function(callback) {

    MetaCoin.deployed().then(function(instance) {
        instance.mint("0xF4CbDa98d2ea054FB0fcB452646C4E973674D209",100);
        instance.getBalance("0xF4CbDa98d2ea054FB0fcB452646C4E973674D209").then(function(balance){
            console.log("balance: "+balance);
        });
    });
};

