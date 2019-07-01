import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {Web3Service} from "../../util/web3.service";
import {MatSnackBar} from "@angular/material";
import {NgForm} from "@angular/forms";

const abi = require('ethereumjs-abi');
const Web3 = require('web3');

declare let require: any; //declares that require in code is defined by external component, in this case web3.service
const dividendToken_artifacts = require('../../../../../build/contracts/DividendToken.json');


@Component({
  selector: 'app-dividend',
  templateUrl: './dividend.component.html',
  styleUrls: ['./dividend.component.css']
})
export class DividendComponent implements OnInit,OnDestroy { //
  address: string;
  sub: any;

  dividendToken: any;
  deployed: any;
/*  isIssuer: boolean;
  isOrchestrator: boolean;*/
  account: string;
/*  name: string;*/


  status = '';


  constructor(private route: ActivatedRoute, private web3Service: Web3Service, private matSnackBar: MatSnackBar) {
  }

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.address = '' + params['address'];
    });

    this.web3Service.artifactsToContract(dividendToken_artifacts)
      .then((DividendTokenAbstraction) => {
        this.dividendToken = DividendTokenAbstraction;

        this.dividendToken.at(Web3.utils.toChecksumAddress(this.address)).then(deployed => {
          console.log(deployed);
          this.deployed = deployed;

         /* this.deployed.name.call({from: this.account}).then((name) => {
            this.name = Web3.utils.toUtf8(name);
          });*/

          /*this.deployed.isIssuable.call({from: this.account}).then((is) => {
            this.issuable = is;
          });*/

          this.web3Service.getAccounts().then(accs => {
            this.account = accs[0];
            this.watchAccount();
           /* this.checkRole();
            this.watchAccount();*/
          }); //fallback if the observable does not publish

        });

      });

  }


  async distributeDividends(sendForm: NgForm) {
    if (!sendForm.valid) {
      this.setStatusFailure('Form invalid');
    }
    if (!this.deployed) {
      this.setStatusFailure('contract is not loaded, unable to send');
      return;
    }
    let amount = sendForm.value.amount;

    try {
      console.log("Trying to distribute " + amount + " Ether.");
      const transaction = await this.deployed.distributeDividends({from: this.account , value: Web3.utils.toWei(amount, "ether")});
      if (!transaction) {
        this.setStatusFailure('Distributing Failed.');
      } else {
        this.setStatusSuccess(amount + ' Ether distributed.');
      }
    } catch (e) {
      this.showError(e);
    }
  }


  async withdrawDividends(form: NgForm) {
    if (!form.valid) {
      this.setStatusFailure('Form invalid');
    }
    if (!this.deployed) {
      this.setStatusFailure('contract is not loaded, unable to send');
      return;
    }

    try {
      console.log("Trying to withdraw");
      const transaction = await this.deployed.withdrawDividend({from: this.account});
      if (!transaction) {
        this.setStatusFailure('Withrawing Failed.');
      } else {
        this.setStatusSuccess('Ether withdrawn.');
      }
    } catch (e) {
      this.showError(e);
    }
  }

  async dividendOf(form: NgForm) {
    if (!form.valid) {
      this.setStatusFailure('Form invalid');
    }
    if (!this.deployed) {
      this.setStatusFailure('contract is not loaded, calculate dividends');
      return;
    }

    let owner = form.value.owner;

    try {
      console.log("Trying to check dividends of " + owner);
      const dividends = await this.deployed.dividendOf(Web3.utils.toChecksumAddress(owner), {from: this.account});
      if (!dividends) {
        this.setStatusFailure('Sending Token Failed.');
      } else {
        this.setStatus(owner + ' is entitled to  ' + Web3.utils.fromWei(dividends, 'ether') + ' Ether in dividends');
      }
    } catch (e) {
      this.showError(e);
    }
  }


  showError(e) {
    let errorstring = new String(e);
    let index: number = errorstring.indexOf("VM Exception while processing transaction: revert");
    if (index != -1) {
      this.setStatusFailure(errorstring.substring(index + 49));
    } else this.setStatusFailure('Error sending tokens; see log.');
    console.log(e);
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
    });
  }
 /*

  updateRolesAndBalance() {
    this.checkRole();
    this.refreshBalance();
  }

  async refreshBalance() {
    console.log('Refreshing balance');
    try {
      const balance = await this.deployed.balanceOf.call(this.account);
      console.log('Found balance: ' + balance);
      this.balance = balance;
    } catch (e) {
      console.log(e);
      this.setStatusFailure('Error getting balance; see log.');
    }
  }

  checkRole() {
    console.log("CheckingRole..");
    if (this.account) {
      this.deployed.isOrchestrator.call(this.account, {from: this.account}).then((is) => {
        console.log("Is Orchestrator:");
        console.log(is);
        this.isOrchestrator = is;
      });
      this.deployed.isIssuer.call(this.account, {from: this.account}).then((is) => {
        console.log("Is Issuer:");
        console.log(is);
        this.isIssuer = is;
      });
    }
  }
*/
  ngOnDestroy() {
    this.sub.unsubscribe();
  }

}
