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

  proxyList: { id, address }[] = [];
  kyc: any;
  deployed: any;
  isListManager: boolean;
  account: string;


  status = '';


  constructor(private route: ActivatedRoute, private web3Service: Web3Service, private matSnackBar: MatSnackBar) {
  }


  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.address = '' + params['address'];
    });

    this.web3Service.artifactsToContract(kyc_artifacts)
      .then((KYCAbstraction) => {
        this.kyc = KYCAbstraction;

        this.kyc.at(Web3.utils.toChecksumAddress(this.address)).then(deployed => { //TODO if this does not work, kyc update also needs fixing
          console.log(deployed);
          this.deployed = deployed;
          this.watchAccount();
        });

      });

  }

  async addAddress(addForm: NgForm) {
    if (!addForm.valid) {
      this.setStatus('Form invalid');
    }
    if (!this.kyc) {
      this.setStatus('kyc is not loaded, unable to add Address');
      return;
    }
    let address = addForm.value.address;

    console.log('Adding ' + address + ' to whitelist.');
    try {

      const transaction = await this.deployed.addAddressToWhitelist.sendTransaction(Web3.utils.toChecksumAddress(address), {from: this.account});
      if (!transaction) {
        this.setStatus('Whitelist Adding Failed.');
      } else {
        this.setStatus('Address ' + address + ' added to whitelist');
      }
    } catch (e) {
      console.log(e);
      this.setStatus('Error adding to whitelist; see log.');
    }
  }


  async removeAddress(removeForm: NgForm) {
    if (!removeForm.valid) {
      this.setStatus('Form invalid');
    }
    if (!this.kyc) {
      this.setStatus('kyc is not loaded, unable to remove Address');
      return;
    }
    let address = removeForm.value.address;

    console.log('Removing ' + address + ' from whitelist.');
    try {

      const transaction = await this.deployed.removeAddressFromWhitelist.sendTransaction(Web3.utils.toChecksumAddress(address), {from: this.account});
      if (!transaction) {
        this.setStatus('Whitelist Removing Failed.');
      } else {
        this.setStatus('Address ' + address + ' removed from whitelist');
      }
    } catch (e) {
      console.log(e);
      this.setStatus('Error removing from whitelist; see log.');
    }
  }

  async checkAddress(checkForm: NgForm) {
    if (!checkForm.valid) {
      this.setStatus('Form invalid');
    }
    if (!this.kyc) {
      this.setStatus('kyc is not loaded, unable to check Address');
      return;
    }
    let address = checkForm.value.address;

    console.log('Checking ' + address + ' on whitelist.');


    const onWhitelist = await this.deployed._onWhitelist.call(Web3.utils.toChecksumAddress(address), {from: this.account});
    if (!onWhitelist) {
      this.setStatusSuccess(address + ' is not on Whitelist');
    } else {
      this.setStatusFailure(address + ' is on Whitelist');
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
    this.deployed.isKYCListManager.call(this.account, {from: this.account}).then((is) => {
      console.log("Is ListManager:");
      console.log(is);
      this.isListManager = is;
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
