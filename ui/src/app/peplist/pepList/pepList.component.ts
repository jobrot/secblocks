import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Web3Service} from "../../util/web3.service";
import {MatSnackBar} from "@angular/material";
import {NgForm} from "@angular/forms";

const abi = require('ethereumjs-abi');
const Web3 = require('web3');

declare let require: any; //declares that require is defined by external component, in this case web3.service
const pepList_artifacts = require('../../../../../build/contracts/PepListVerifier.json');

@Component({
  selector: 'app-pepList',
  templateUrl: './pepList.component.html',
  styleUrls: ['./pepList.component.css']
})
export class PepListComponent implements OnInit, OnDestroy {
  address: string;
  sub: any;

  pepList: any;
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
    this.web3Service.artifactsToContract(pepList_artifacts)
      .then((PepListAbstraction) => {
        this.pepList = PepListAbstraction;

        this.pepList.at(Web3.utils.toChecksumAddress(this.address)).then(deployed => {
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
    if (!this.pepList) {
      this.setStatusFailure('pepList is not loaded, unable to add Address');
      return;
    }
    let address = addForm.value.address;

    console.log('Adding ' + address + ' to blacklist.');
    try {

      const transaction = await this.deployed.addAddressToBlacklist.sendTransaction(Web3.utils.toChecksumAddress(address), {from: this.account});
      if (!transaction) {
        this.setStatusFailure('Blacklist Adding Failed.');
      } else {
        this.setStatusSuccess('Address ' + address + ' added to blacklist');
      }
    } catch (e) {
      this.showError(e);
    }
  }


  async removeAddress(removeForm: NgForm) {
    if (!removeForm.valid) {
      this.setStatusFailure('Form invalid');
    }
    if (!this.pepList) {
      this.setStatusFailure('pepList is not loaded, unable to remove Address');
      return;
    }
    let address = removeForm.value.address;

    console.log('Removing ' + address + ' from blacklist.');
    try {

      const transaction = await this.deployed.removeAddressFromBlacklist.sendTransaction(Web3.utils.toChecksumAddress(address), {from: this.account});
      if (!transaction) {
        this.setStatusFailure('Blacklist Removing Failed.');
      } else {
        this.setStatusSuccess('Address ' + address + ' removed from blacklist');
      }
    } catch (e) {
      this.showError(e);
    }
  }

  async checkAddress(checkForm: NgForm) {
    if (!checkForm.valid) {
      this.setStatusFailure('Form invalid');
    }
    if (!this.pepList) {
      this.setStatusFailure('pepList is not loaded, unable to check Address');
      return;
    }
    let address = checkForm.value.address;

    console.log('Checking ' + address + ' on blacklist.');

    const onBlacklist = await this.deployed._onBlacklist.call(Web3.utils.toChecksumAddress(address), {from: this.account});
    if (!onBlacklist) {
      this.setStatusSuccess(address + ' is not on Blacklist');
    } else {
      this.setStatusFailure(address + ' is on Blacklist');
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
      this.deployed.isPEPListManager.call(this.account, {from: this.account}).then((is) => {
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
