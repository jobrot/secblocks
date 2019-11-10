# SecBlocks
Secblocks, shorthand for "Securities on the Blockchain" is a prototypical Implementation of a decentralized Securities Trading system on the [Ethereum](https://ethereum.org/) platform. It aims to enable retail banks to tokenize securities that already exist in the traditional system. The technical possibilities for legal compliance with the respective jurisdiction are given by expandable and configurable KYC and AML modules.

The system is written in Solidity with an Angular Frontend and builds upon the [ERC-1400 Security Token Standard](https://thesecuritytokenstandard.org/) and also implements the ERC-20 Token Standard. It also utilizes some libraries by [OpenZeppelin](https://openzeppelin.com/) and [truffle](https://www.trufflesuite.com/). 


# Features
Some exemplary features include:

* Creation and Trading of Security Tokens
* [KYC](https://en.wikipedia.org/wiki/Know_your_customer)-, [Insider](https://en.wikipedia.org/wiki/Insider_trading)- and [PEP](https://en.wikipedia.org/wiki/Politically_exposed_person)- white and blacklisting, as well as custom lists
* [AML](https://en.wikipedia.org/wiki/Money_laundering#Combating) checks with regards to recipient of funds over a configurable rolling timeframe
* Voting with regards to held shares, corresponding to [shareholder voting](https://www.investor.gov/research-before-you-invest/research/shareholder-voting) 
* Dividend payments for shareholders 
* Role Based Access Model


## Requirements

Use npm to install [ganache-cli](https://github.com/trufflesuite/ganache-cli), or install the [gui version](https://www.trufflesuite.com/ganache). Ganache is used to start a local Ethereum blockchain for local testing.

```bash
npm install -g ganache-cli
```

Install [truffle](https://www.trufflesuite.com/docs/truffle/overview) which is used to deploy smart contracts to a blockchain.


```bash
npm install -g truffle
```


## Usage

Start a ganache chain with a mnemonic phrase. You need to use this phrase later to import the private keys of the wallet that has the initial supply of tokens into [Metamask](https://metamask.io/) or another client that you use to interact with the blockchain.

```bash
ganache-cli -m "mystery various crawl foam old often soon desk story help oil flight" 

truffle migrate --reset

npm start
```

TODO roles

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)

This work is released as a supplement for my Master's Thesis, which will be linked here as soon as it is published.