import { Component, OnInit } from '@angular/core';
import {Web3Service} from '../../util/web3.service';
import { MatSnackBar } from '@angular/material';
const abi = require('ethereumjs-abi');
const Web3 = require('web3');
//const utils = require('web3-utils');

declare let require: any; //declares that require is defined by external component, in this case web3.service
const registry_artifacts = require('../../../../../build/contracts/Registry.json');

@Component({
  selector: 'app-registry',
  templateUrl: './registry.component.html',
  styleUrls: ['./registry.component.css']
})




export class RegistryComponent implements OnInit {
   accounts: string[];
   //proxy: [string, string];
   proxyList: {id, address}[]= [];
  //let proxylist: proxy[];
  Registry: any;

  model = {
    newproxy: {
      proxyid: '',
      address: ''
    },
    viewproxy: {
      proxyid: '',
      address: ''
    },
    proxycount: 0,
    account: ''
  };

  status = '';



  constructor(private web3Service: Web3Service, private matSnackBar: MatSnackBar) {
    console.log('Constructor: ' + web3Service);
  }

  ngOnInit(): void {
    console.log('OnInit: ' + this.web3Service);
    console.log(this);
    //this.watchAccount();
    this.web3Service.artifactsToContract(registry_artifacts)
      .then((RegistryAbstraction) => {
        this.Registry = RegistryAbstraction;
        this.Registry.deployed().then(deployed => {
          console.log(deployed);
          /*deployed.getProxyIdList.call({from: this.model.account}).then((list) =>{
            //this.proxyIdList = list;
            console.log("List:");
            console.log(list);
          });*/
          this.updateProxies();
          /*deployed.Transfer({}, (err, ev) => {
            console.log('Transfer event came in, refreshing balance');
            this.refreshBalance();
          });*/
        });

      });
  }


/*  deployed.proxies.call('VotingTokenExampleCompany').then((transaction) =>{
  console.log("hier!");
  console.log(transaction);
});*/
  async updateProxies(){
      console.log("Updating Proxies..");
/*    let isPresent: boolean = true;
    let i: number = 0;*/
    //while(isPresent){
    const deployed = await this.Registry.deployed();
/*    let proxyName;
    console.log(deployed);
    console.log("checking proxy");
    proxyName = await deployed.proxyIdList.call(1,{from: this.model.account});
    //proxyName = deployed.proxies.call(abi.rawEncode(['bytes32'], ['VotingTokenExampleCompany']),{from: this.model.account});

    console.log("proxyname:");
    console.log(proxyName);

    console.log( Web3.utils.toAscii(proxyName));*/



    for(let id of await deployed.getProxyIdList.call({from: this.model.account})){
     let asciiid = Web3.utils.toUtf8(id);

      let address = await deployed.proxies.call(id);
      /*console.log(asciiid +": ");
      console.log(address);
*/

      this.proxyList.push({id: asciiid,address: address});

    }
    console.log(this.proxyList);



    //}
  }


  openContract(id, address){
    console.log(id);
    console.log(address);
    //TODO open relevant with route parameter in http format
  }



  async createProxy() {
    if (!this.Registry) {
      this.setStatus('Registry is not loaded, unable to create Proxy');
      return;
    }

    const proxyid = this.model.newproxy.proxyid;


    console.log('Creating proxy with id' + proxyid);

    this.setStatus('Initiating transaction... (please wait)');
    try {
      const deployedRegistry = await this.Registry.deployed(); //TODO maybe replace by global variable for deployed instance to speed up
      const transaction = await deployedRegistry.createProxy.sendTransaction(proxyid, {from: this.model.account});

      if (!transaction) {
        this.setStatus('Proxy Creation Failed.');
      } else {
        this.setStatus('Proxy'+proxyid+'created at ' );
      }
    } catch (e) {
      console.log(e);
      this.setStatus('Error sending coin; see log.');
    }
  }

  setStatus(status) {
    this.matSnackBar.open(status, null, {duration: 3000});
  }

}
