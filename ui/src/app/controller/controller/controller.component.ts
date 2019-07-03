import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {Web3Service} from "../../util/web3.service";
import {MatSnackBar} from "@angular/material";
import {NgForm} from "@angular/forms";

const abi = require('ethereumjs-abi');
const Web3 = require('web3');

declare let require: any; //declares that require in code is defined by external component, in this case web3.service
const controller_artifacts = require('../../../../../build/contracts/Controller.json');


@Component({
  selector: 'app-controller',
  templateUrl: './controller.component.html',
  styleUrls: ['./controller.component.css']
})
export class ControllerComponent implements OnInit {
  address: string;
  sub: any;

  controller: any;
  deployed: any;
  isOrchestrator: boolean;
  account: string;

  kycVerifier: string;
  insiderListVerifier: string;
  pepListVerifier: string;
  generalVerifiers: string[] = [];

  constructor(private route: ActivatedRoute, private web3Service: Web3Service, private matSnackBar: MatSnackBar, private router: Router) {
  }

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.address = '' + params['address'];
    });

    this.web3Service.artifactsToContract(controller_artifacts)
      .then((ControllerAbstraction) => {
        this.controller = ControllerAbstraction;

        this.controller.at(Web3.utils.toChecksumAddress(this.address)).then(deployed => {
          console.log(deployed);
          this.deployed = deployed;

          this.web3Service.getAccounts().then(accs => {
            this.account = accs[0];
            this.checkRole();
            this.watchAccount();
            this.getVerifiers();

          }); //fallback if the observable does not publish

        });

      });

  }

  async setKYC(form: NgForm) {
    if(!form.valid){
      this.setStatusSuccess('Form invalid');
    }
    if (!this.deployed) {
      this.setStatusFailure('registry is not loaded, unable set KYC');
      return;
    }
    let address = form.value.address;

    console.log('Setting KYC with address' + address);
    try {
      const transaction = await this.deployed.setKYCVerifier.sendTransaction(Web3.utils.toChecksumAddress(address), {from: this.account});
      if (!transaction) {
        this.setStatusFailure('Setting KYC Failed.');
      } else {
        this.setStatusSuccess('KYC set to '+ address);
        this.getVerifiers();
      }
    } catch (e) {
      this.showError(e);
    }
  }


  async setPEP(form: NgForm) {
    if(!form.valid){
      this.setStatusSuccess('Form invalid');
    }
    if (!this.deployed) {
      this.setStatusFailure('registry is not loaded, unable set PEP');
      return;
    }
    let address = form.value.address;

    console.log('Setting PEP with address' + address);
    try {
      const transaction = await this.deployed.setPEPListVerifier.sendTransaction(Web3.utils.toChecksumAddress(address), {from: this.account});
      if (!transaction) {
        this.setStatusFailure('Setting PEP Failed.');
      } else {
        this.setStatusSuccess('PEP set to '+ address);
        this.getVerifiers();
      }
    } catch (e) {
      this.showError(e);
    }
  }

  async setInsiderList(form: NgForm) {
    if(!form.valid){
      this.setStatusSuccess('Form invalid');
    }
    if (!this.deployed) {
      this.setStatusFailure('registry is not loaded, unable set InsiderList');
      return;
    }
    let address = form.value.address;

    console.log('Setting InsiderList with address' + address);
    try {
      const transaction = await this.deployed.setInsiderListVerifier.sendTransaction(Web3.utils.toChecksumAddress(address), {from: this.account});
      if (!transaction) {
        this.setStatusFailure('Setting InsiderList Failed.');
      } else {
        this.setStatusSuccess('InsiderList set to '+ address);
        this.getVerifiers();
      }
    } catch (e) {
      this.showError(e);
    }
  }

  async addGeneralVerifier(form: NgForm) {
    if(!form.valid){
      this.setStatusSuccess('Form invalid');
    }
    if (!this.deployed) {
      this.setStatusFailure('registry is not loaded, unable add Verifier');
      return;
    }
    let address = form.value.address;

    console.log('Adding Verifier with address' + address);
    try {
      const transaction = await this.deployed.addVerifier.sendTransaction(Web3.utils.toChecksumAddress(address), {from: this.account});
      if (!transaction) {
        this.setStatusFailure('Adding Verifier Failed.');
      } else {
        this.setStatusSuccess('Verifier with address '+ address+ ' added.');
        this.getVerifiers();
      }
    } catch (e) {
      this.showError(e);
    }
  }


  async removeGeneralVerifier(address: string) {

    if (!this.deployed) {
      this.setStatusFailure('registry is not loaded, unable remove Verifier');
      return;
    }

    console.log('Removing Verifier with address' + address);
    try {
      const transaction = await this.deployed.removeVerifier.sendTransaction(Web3.utils.toChecksumAddress(address), {from: this.account});
      if (!transaction) {
        this.setStatusFailure('Removing Verifier Failed.');
      } else {
        this.setStatusSuccess('Verifier with address '+ address+ ' removed.');
        this.getVerifiers();
      }
    } catch (e) {
      this.showError(e);
    }
  }


  async getVerifiers(){
    this.kycVerifier = await this.deployed.kycVerifier.call({from: this.account});
    this.insiderListVerifier = await this.deployed.insiderListVerifier.call({from: this.account});
    this.pepListVerifier = await this.deployed.pepListVerifier.call({from: this.account});


    this.generalVerifiers = [];
    var verifierCount = (await this.deployed.getVerifierCount.call({from: this.account}));
    for (var i = 0; i<verifierCount ; i++) {
      this.generalVerifiers.push(await this.deployed.verifiers.call(i, {from: this.account}));
    }

  }


  showError(e) {
    let errorstring = new String(e);
    let index: number = errorstring.indexOf("VM Exception while processing transaction: revert");
    if (index != -1) {
      this.setStatusFailure(errorstring.substring(index + 49));
    } else this.setStatusFailure('Error executing transaction; see log.');
    console.log(e);
  }


  setStatusSuccess(status) {
    this.matSnackBar.open(status, null, {duration: 3000, panelClass: ['style-success'],});
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

  checkRole() {
    console.log("CheckingRole..");
    if (this.account) {
      this.deployed.isOrchestrator.call(this.account, {from: this.account}).then((is) => {
        console.log("Is Orchestrator:");
        console.log(is);
        this.isOrchestrator = is;
      });
    }
  }

}
