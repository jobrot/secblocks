// var fs = require('fs');
// var jsonFile = "C:/Users/jobro/Documents/Studium/Diplomarbeit/Development/metacoin/build/contracts/VotingToken.json";
// var parsed= JSON.parse(fs.readFileSync(jsonFile));
// var abi = parsed.abi;
//  var contract = new web3.eth.Contract(abi, '0x8f53376f49cB10dB73d65B311028217A4AC46014');

/*
truffle develop --log
truffle debug

  https://truffleframework.com/docs/truffle/getting-started/interacting-with-your-contracts

*/



https://truffleframework.com/tutorials/debugging-a-smart-contract








let accounts = await web3.eth.getAccounts()
let instance = await VotingToken.deployed() 

//let because develop should always be restarted


let kyc = await KYCController.deployed()
 kyc.addAddressToWhitelist(accounts[0],{from: accounts[0]})


let insider = await InsiderListController.deployed()
 insider.addAddressToBlacklist(accounts[0],{from: accounts[0]})

 let pep = await PEPListController.deployed()
 pep.addAddressToBlack(accounts[0],{from: accounts[0]})

instance.issue(accounts[0],10,'0x6e656f',{from: accounts[0]})

instance.transferWithData(accounts[1],1,'0x6e656f',{from: accounts[0]})

instance.balanceOf(accounts[0],{from: accounts[0]})

instance.balanceOfAt(accounts[0], 4,{from: accounts[0]})

instance.totalSupply({from: accounts[0]})


instance1.distributeDividends({from: accounts[3],value: Web3.utils.toWei('1', 'ether');})


web3.eth.getBalance(accounts[0])



/*


 migrate --reset !!!! sonst funktionierts nicht!!!!!!!
 danach neu .deployed() aufrufen, sonst funktionierts nicht

!!!!!! DEPLOYED CALLS ANYY CONTRACT; NOT THE LAST DEPLOYED!!!!!  --> blödsinn

UND!!!!! DEPLOY CONSOLE ALLE SCHLIESSEN, AUCH DEN DEBUG, SONST IST IRGENDWIE EIN GECACHTER CODE DRIN -> auch blödsinn, nur aufpassen, dass nicht alte instanz verwendet wird -.-

*/