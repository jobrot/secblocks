import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Web3Service} from "../../util/web3.service";
import {MatSnackBar} from "@angular/material";
import {NgForm} from "@angular/forms";

const abi = require('ethereumjs-abi');
const Web3 = require('web3');

declare let require: any; //declares that require is defined by external component, in this case web3.service
const kyc_artifacts = require('../../../../../build/contracts/KYCVerifier.json');

@Component({
  selector: 'app-kyc',
  templateUrl: './kyc.component.html',
  styleUrls: ['./kyc.component.css']
})
export class KycComponent implements OnInit, OnDestroy {
  address: string;
  sub: any;

  kyc: any;
  deployed: any;
  isListManager: boolean;
  account: string;


  status = '';


  constructor(private route: ActivatedRoute, private web3Service: Web3Service, private matSnackBar: MatSnackBar) {
    this.sub = this.route.params.subscribe(params => {
      this.address = '' + params['address'];


    });
  }


  ngOnInit() {
    this.web3Service.artifactsToContract(kyc_artifacts)
      .then((KYCAbstraction) => {
        this.kyc = KYCAbstraction;

        this.kyc.at(Web3.utils.toChecksumAddress(this.address)).then(deployed => {
          console.log(deployed);
          this.deployed = deployed;


          this.web3Service.getAccounts().then(accs => {
            this.account = accs[0];
            this.checkRole();
            this.watchAccount();
          }); //fallback if the observable does not publish
        });
      });

  }

  async addAddress(addForm: NgForm) {
    if (!addForm.valid) {
      this.setStatusFailure('Form invalid');
    }
    if (!this.kyc) {
      this.setStatusFailure('kyc is not loaded, unable to add Address');
      return;
    }
    let address = addForm.value.address;

    console.log('Adding ' + address + ' to whitelist.');
    try {

      const transaction = await this.deployed.addAddressToWhitelist.sendTransaction(Web3.utils.toChecksumAddress(address), {from: this.account});
      if (!transaction) {
        this.setStatusFailure('Whitelist Adding Failed.');
      } else {
        this.setStatusSuccess('Address ' + address + ' added to whitelist');
      }
    } catch (e) {
      this.showError(e);
    }
  }


  async removeAddress(removeForm: NgForm) {
    if (!removeForm.valid) {
      this.setStatusFailure('Form invalid');
    }
    if (!this.kyc) {
      this.setStatusFailure('kyc is not loaded, unable to remove Address');
      return;
    }
    let address = removeForm.value.address;

    console.log('Removing ' + address + ' from whitelist.');
    try {

      const transaction = await this.deployed.removeAddressFromWhitelist.sendTransaction(Web3.utils.toChecksumAddress(address), {from: this.account});
      if (!transaction) {
        this.setStatusFailure('Whitelist Removing Failed.');
      } else {
        this.setStatusSuccess('Address ' + address + ' removed from whitelist');
      }
    } catch (e) {
      this.showError(e);
    }
  }

  async checkAddress(checkForm: NgForm) {
    if (!checkForm.valid) {
      this.setStatusFailure('Form invalid');
    }
    if (!this.kyc) {
      this.setStatusFailure('kyc is not loaded, unable to check Address');
      return;
    }
    let address = checkForm.value.address;

    console.log('Checking ' + address + ' on whitelist.');

    const onWhitelist = await this.deployed._onWhitelist.call(Web3.utils.toChecksumAddress(address), {from: this.account});
    if (!onWhitelist) {
      this.setStatusFailure(address + ' is not on Whitelist');
    } else {
      this.setStatusSuccess(address + ' is on Whitelist');
    }

  }


  setStatus(status) {
    this.matSnackBar.open(status, null, {duration: 3000});
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
    if(this.account) {
      this.deployed.isKYCListManager.call(this.account, {from: this.account}).then((is) => {
        console.log("Is ListManager:");
        console.log(is);
        this.isListManager = is;
      });
    }
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  showError(e) {
    let errorstring = new String(e);
    let index: number = errorstring.indexOf("VM Exception while processing transaction: revert");
    if (index != -1) {
      this.setStatusFailure(errorstring.substring(index + 49));
    } else this.setStatusFailure('Error executing Transaction; see log.');
    console.log(e);
  }

}
