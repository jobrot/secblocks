import {Component, OnInit} from '@angular/core';
import {Web3Service} from '../../util/web3.service';
import {MatSnackBar} from '@angular/material';
import {NgForm} from "@angular/forms";
import {Router} from "@angular/router";

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

  proxyList: { id, address }[] = [];
  registry: any;
  deployed: any;
  isOrchestrator: boolean;
  account='';


  status = '';


  constructor(private web3Service: Web3Service, private matSnackBar: MatSnackBar, private router: Router) {
  }

  ngOnInit() {

    this.web3Service.artifactsToContract(registry_artifacts)
      .then((RegistryAbstraction) => {
        this.registry = RegistryAbstraction;
        this.registry.deployed().then(deployed => {
          console.log(deployed);
          this.deployed = deployed;

          this.web3Service.getAccounts().then(accs => {
            this.account = accs[0];
            this.checkRole();
            this.watchAccount();
          }); //fallback if the observable does not publish

          this.updateProxies();
        });

      });
  }


  async updateProxies() {
    console.log("Updating Proxies..");

    const deployed = this.deployed;


    for (let id of await deployed.getProxyIdList.call({from: this.account})) {
      let asciiid = Web3.utils.toUtf8(id);
      let address = await deployed.proxies.call(id);
      this.proxyList.push({id: asciiid, address: address});
    }
    console.log(this.proxyList);

  }

  route(id: string, address: string){
    console.log(id);
    console.log(address);

    if(id.startsWith("KYC")){
      this.router.navigate(['kyc/'+address]);
    }
    else if(id.startsWith("ERC1495")){
      this.router.navigate(['erc1594/'+address]);
    }
    else if(id.startsWith("DividendToken")){
      this.router.navigate(['dividendToken/'+address]);
    }
    else if(id.startsWith("VotingToken")){
      this.router.navigate(['dividendToken/'+address]); //TODO
    }
    else {
      this.setStatusFailure("Could not Recognize this kind of Proxy. Please rename it according to the conventions in Registry.sol.")
    }
  }


  async createProxy(createForm: NgForm) {
    if(!createForm.valid){
      this.setStatus('Form invalid');
    }
    if (!this.registry) {
      this.setStatus('registry is not loaded, unable to create Proxy');
      return;
    }
    let proxyId = createForm.value.proxyId;

    console.log('Creating proxy with id' + proxyId);
    try {

      const transaction = await this.deployed.createProxy.sendTransaction(Web3.utils.fromAscii(proxyId), {from: this.account});
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


  async addProxy(addForm: NgForm) {
    if(!addForm.valid){
      this.setStatus('Form invalid');
    }
    if (!this.registry) {
      this.setStatus('registry is not loaded, unable to add Proxy');
      return;
    }
    let proxyId = addForm.value.proxyId;
    let address = addForm.value.address;

    console.log('Adding proxy with id' + proxyId);
    try {

      const transaction = await this.deployed.addProxy.sendTransaction(Web3.utils.fromAscii(proxyId),Web3.utils.toChecksumAddress(address), {from: this.account});
      if (!transaction) {
        this.setStatus('Proxy Adding Failed.');
      } else {
        this.setStatus('Proxy' + proxyId + ' added at '+ transaction.logs[0].args.proxyAddress);
        this.updateProxies()
      }
    } catch (e) {
      console.log(e);
      this.setStatus('Error adding proxy; see log.');
    }
  }


  async updateProxy(updateForm: NgForm) {
    if(!updateForm.valid){
      this.setStatus('Form invalid');
    }
    if (!this.registry) {
      this.setStatus('registry is not loaded, unable to update Proxy');
      return;
    }
    let proxyId = updateForm.value.proxyId;
    let address = updateForm.value.address;

    console.log('Updating proxy with id' + proxyId);
    try {

      const transaction = await this.deployed.updateProxy.sendTransaction(Web3.utils.fromAscii(proxyId),Web3.utils.toChecksumAddress(address), {from: this.account});
      // console.log("t");
      // console.log(transaction);
      if (!transaction) {
        this.setStatus('Proxy Updating Failed.');
      } else {
        this.setStatus('Proxy' + proxyId + ' updated at '+ transaction.logs[0].args.proxyAddress);
        this.updateProxies()
      }
    } catch (e) {
      console.log(e);
      this.setStatus('Error updating proxy; see log.');
    }
  }


  setStatus(status) {
    this.matSnackBar.open(status, null, {duration: 3000});
  }

  setStatusFailure(status) {
    this.matSnackBar.open(status, null, {duration: 3000, panelClass: ['style-failure'],});
  }

  watchAccount() {
    this.web3Service.accountsObservable.subscribe((accounts) => {

      this.account = accounts[0];
      this.checkRole();
    });
  }

  checkRole(){
    if(this.account) {
      this.deployed.isOrchestrator.call(this.account, {from: this.account}).then((is) => {
        console.log("Is Orchestrator:");
        console.log(is);
        this.isOrchestrator = is;
      });
    }
  }

}
