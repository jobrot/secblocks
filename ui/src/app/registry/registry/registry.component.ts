import {Component, OnInit} from '@angular/core';
import {Web3Service} from '../../util/web3.service';
import {MatSnackBar} from '@angular/material';
import {NgForm} from "@angular/forms";

const abi = require('ethereumjs-abi');
const Web3 = require('web3');

declare let require: any; //declares that require is defined by external component, in this case web3.service
const registry_artifacts = require('../../../../../build/contracts/Registry.json');

@Component({
  selector: 'app-registry',
  templateUrl: './registry.component.html',
  styleUrls: ['./registry.component.css']
})


export class RegistryComponent implements OnInit {
  accounts: string[];
  proxyList: { id, address }[] = [];
  registry: any;
  deployed: any;
  isOrchestrator: boolean;

  model = {
    account: ''
  };

  status = '';


  constructor(private web3Service: Web3Service, private matSnackBar: MatSnackBar) {
    console.log('Constructor: ' + web3Service);
  }

  ngOnInit(): void {
    console.log('OnInit: ' + this.web3Service);

    this.web3Service.artifactsToContract(registry_artifacts)
      .then((RegistryAbstraction) => {
        this.registry = RegistryAbstraction;
        this.registry.deployed().then(deployed => {
          console.log(deployed);
          this.deployed = deployed;
          this.watchAccount();
          this.updateProxies();
        });

      });
  }


  async updateProxies() {
    console.log("Updating Proxies..");

    const deployed = this.deployed;


    for (let id of await deployed.getProxyIdList.call({from: this.model.account})) {
      let asciiid = Web3.utils.toUtf8(id);
      let address = await deployed.proxies.call(id);
      this.proxyList.push({id: asciiid, address: address});
    }
    console.log(this.proxyList);

  }


  async createProxy(proxyId) {
    if (!this.registry) {
      this.setStatus('registry is not loaded, unable to create Proxy');
      return;
    }

    console.log('Creating proxy with id' + proxyId);
    try {

      const transaction = await this.deployed.createProxy.sendTransaction(Web3.utils.fromAscii(proxyId), {from: this.model.account});
      if (!transaction) {
        this.setStatus('Proxy Creation Failed.');
      } else {
        this.setStatus('Proxy' + proxyId + ' created at '+ transaction.logs[0].args.proxyAddress);
        this.updateProxies()
      }
    } catch (e) {
      console.log(e);
      this.setStatus('Error creating proxy; see log.');
    }


  }

  onSubmit(create: NgForm) {
    if(create.valid){
      this.createProxy(create.value.proxyId);
    }
  }

  setStatus(status) {
    this.matSnackBar.open(status, null, {duration: 3000});
  }

  watchAccount() {
    this.web3Service.accountsObservable.subscribe((accounts) => {
      this.accounts = accounts;
      this.model.account = accounts[0];
      this.checkRole();
    });
  }

  checkRole(){
    this.deployed.isOrchestrator.call(this.model.account, {from: this.model.account}).then((is) =>{
      console.log("Is Orchestrator:");
      console.log(is);
      this.isOrchestrator = is;
    });
  }

}
