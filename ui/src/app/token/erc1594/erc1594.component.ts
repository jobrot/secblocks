import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {Web3Service} from "../../util/web3.service";
import {MatSnackBar} from "@angular/material";
import {NgForm} from "@angular/forms";


const abi = require('ethereumjs-abi');
const Web3 = require('web3');

declare let require: any; //declares that require is defined by external component, in this case web3.service
const erc1594_artifacts = require('../../../../../build/contracts/ERC1594.json');
const emptyBytes = Web3.utils.fromAscii("");

@Component({
  selector: 'app-erc1594',
  templateUrl: './erc1594.component.html',
  styleUrls: ['./erc1594.component.css']
})
export class Erc1594Component implements OnInit, OnDestroy {
  address: string;
  sub: any;

  erc1594: any;
  deployed: any;
  isIssuer: boolean;
  isOrchestrator: boolean;
  account: string;
  name: string;
  balance: number = 0;
  issuable: boolean;


  status = '';


  constructor(private route: ActivatedRoute, private web3Service: Web3Service, private matSnackBar: MatSnackBar) {
  }

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.address = '' + params['address'];
    });

    this.web3Service.artifactsToContract(erc1594_artifacts)
      .then((ERC1594Abstraction) => {
        this.erc1594 = ERC1594Abstraction;

        this.erc1594.at(Web3.utils.toChecksumAddress(this.address)).then(deployed => {
          console.log(deployed);
          this.deployed = deployed;

          this.deployed.name.call({from: this.account}).then((name) => {
            this.name = Web3.utils.toUtf8(name);
          });

          this.deployed.isIssuable.call({from: this.account}).then((is) => {
            this.issuable = is;
          });

          this.web3Service.getAccounts().then(accs => {
            this.account = accs[0];
            this.checkRole();
            this.watchAccount();
          }); //fallback if the observable does not publish

        });

      });

  }


  async sendTokens(sendForm: NgForm) {
    if (!sendForm.valid) {
      this.setStatusFailure('Form invalid');
    }
    if (!this.deployed) {
      this.setStatusFailure('contract is not loaded, unable to send');
      return;
    }
    let amount = sendForm.value.amount;
    let receiver = sendForm.value.receiver;

    try {
      console.log("Trying to send " + amount + " to " + receiver);
      const transaction = await this.deployed.transfer(Web3.utils.toChecksumAddress(receiver), amount, {from: this.account});
      if (!transaction) {
        this.setStatusFailure('Sending Token Failed.');
      } else {
        this.setStatusSuccess(amount + ' Tokens sent to ' + receiver);
      }
    } catch (e) {
      this.showError(e);
    }
    this.updateRolesAndBalance();
  }

  async sendTokensFrom(sendForm: NgForm) {
    if (!sendForm.valid) {
      this.setStatusFailure('Form invalid');
    }
    if (!this.deployed) {
      this.setStatusFailure('contract is not loaded, unable to send');
      return;
    }
    let amount = sendForm.value.amount;
    let receiver = sendForm.value.receiver;
    let from = sendForm.value.from;

    try {
      console.log("Trying to send " + amount + " from " + from + " to " + receiver);
      const transaction = await this.deployed.transferFrom(Web3.utils.toChecksumAddress(from), Web3.utils.toChecksumAddress(receiver), amount, {from: this.account});
      if (!transaction) {
        this.setStatusFailure('Sending Token Failed.');
      } else {
        this.setStatusSuccess(amount + ' Tokens sent to ' + receiver);
      }
    } catch (e) {
      this.showError(e);
    }
    this.updateRolesAndBalance();
  }


  async checkSendTokens(sendForm: NgForm) {
    if (!sendForm.valid) {
      this.setStatusFailure('Form invalid');
    }
    if (!this.deployed) {
      this.setStatusFailure('contract is not loaded, unable to send');
      return;
    }
    let amount = sendForm.value.amount;
    let receiver = sendForm.value.receiver;


    console.log("Checking to send " + amount + " to " + receiver);
    const result = await this.deployed.canTransfer(Web3.utils.toChecksumAddress(receiver), amount, emptyBytes, {from: this.account});
    if (!result[0]) {
      let reason:string;
      if(Web3.utils.toUtf8(result[2])=="")reason = ' Transfer not possible';
      else reason = ' Transfer is not possible due to: ' + Web3.utils.toUtf8(result[2]);

      this.setStatusFailure('Statuscode: '+ result[1] + reason);
    } else {
      this.setStatusSuccess('Transfer is possible');
    }

    this.updateRolesAndBalance();
  }

  async checkSendTokensFrom(sendForm: NgForm) {
    if (!sendForm.valid) {
      this.setStatusFailure('Form invalid');
    }
    if (!this.deployed) {
      this.setStatusFailure('contract is not loaded, unable to send');
      return;
    }
    let amount = sendForm.value.amount;
    let receiver = sendForm.value.receiver;
    let from = sendForm.value.from;


    console.log("Checking to send " + amount + " from "+from+" to " + receiver);
    const result = await this.deployed.canTransferFrom(Web3.utils.toChecksumAddress(from), Web3.utils.toChecksumAddress(receiver), amount, emptyBytes, {from: this.account});
    if (!result[0]) {
      let reason:string;
      if(Web3.utils.toUtf8(result[2])=="")reason = ' Transfer not possible';
      else reason = ' Transfer is not possible due to: ' + Web3.utils.toUtf8(result[2]);

      this.setStatusFailure('Statuscode: '+ result[1] + reason);
    } else {
      this.setStatusSuccess('Transfer is possible');
    }

    this.updateRolesAndBalance();
  }


  async redeemTokens(redeemForm: NgForm) {
    if (!redeemForm.valid) {
      this.setStatusFailure('Form invalid');
    }
    if (!this.deployed) {
      this.setStatusFailure('contract is not loaded, unable to redeem');
      return;
    }
    let amount = redeemForm.value.amount;

    try {
      console.log("Trying to redeem " + amount);
      const transaction = await this.deployed.redeem(amount, emptyBytes, {from: this.account});
      if (!transaction) {
        this.setStatusFailure('redeeming Token Failed.');
      } else {
        this.setStatusSuccess(amount + ' Tokens redeemed ');
      }
    } catch (e) {
      this.showError(e);
    }
    this.updateRolesAndBalance();
  }

  async redeemTokensFrom(redeemForm: NgForm) {
    if (!redeemForm.valid) {
      this.setStatusFailure('Form invalid');
    }
    if (!this.deployed) {
      this.setStatusFailure('contract is not loaded, unable to redeem');
      return;
    }
    let amount = redeemForm.value.amount;
    let from = redeemForm.value.from;

    try {
      console.log("Trying to redeem " + amount + " from " + from);
      const transaction = await this.deployed.redeemFrom(Web3.utils.toChecksumAddress(from), amount, emptyBytes, {from: this.account});
      if (!transaction) {
        this.setStatusFailure('Redeeming Token Failed.');
      } else {
        this.setStatusSuccess(amount + ' Tokens redeemed for ' + from);
      }
    } catch (e) {
      this.showError(e);
    }
    this.updateRolesAndBalance();
  }


  async addIssuer(form: NgForm) {
    if (!form.valid) {
      this.setStatusFailure('Form invalid');
    }
    if (!this.deployed) {
      this.setStatusFailure('contract is not loaded, unable to send');
      return;
    }
    let issuer = form.value.issuer;

    try {
      console.log("Trying to add " + issuer + " as issuer.");
      let transaction;
      if (this.isIssuer) {
        transaction = await this.deployed.addIssuer(Web3.utils.toChecksumAddress(issuer), {from: this.account});
      } else if (this.isOrchestrator) {
        transaction = await this.deployed.addIssuerOrchestrator(Web3.utils.toChecksumAddress(issuer), {from: this.account});
      }
      if (!transaction) {
        this.setStatusFailure('Adding Issuer Failed.');
      } else {
        this.setStatusSuccess(issuer + ' set as Issuer.');
      }
    } catch (e) {
      this.showError(e);
    }
    this.updateRolesAndBalance();
  }


  async closeIssuance() {

    try {
      console.log("Trying to close issuance");
      let transaction;

      transaction = await this.deployed.closeIssuance({from: this.account});

      if (!transaction) {
        this.setStatusFailure('Closing Issuance.');
      } else {
        this.setStatusSuccess('Issuance closed successfully');
        this.issuable = false;
      }
    } catch (e) {
      this.showError(e);
    }
    this.updateRolesAndBalance();
  }


  async issue(form: NgForm) {
    if (!form.valid) {
      this.setStatusFailure('Form invalid');
    }
    if (!this.deployed) {
      this.setStatusFailure('contract is not loaded, unable to issue');
      return;
    }
    let amount = form.value.amount;
    let receiver = form.value.receiver;

    try {
      console.log("Trying to issue " + amount + " to " + receiver);
      const transaction = await this.deployed.issue(Web3.utils.toChecksumAddress(receiver), amount, emptyBytes, {from: this.account});
      if (!transaction) {
        this.setStatusFailure('Issuing Token Failed.');
      } else {
        this.setStatusSuccess(amount + ' Tokens issued to ' + receiver);
      }
    } catch (e) {
      this.showError(e);
    }
    this.updateRolesAndBalance();
  }


  async approve(form: NgForm) {
    if (!form.valid) {
      this.setStatusFailure('Form invalid');
    }
    if (!this.deployed) {
      this.setStatusFailure('contract is not loaded, unable to issue');
      return;
    }
    let amount = form.value.amount;
    let spender = form.value.spender;

    try {
      console.log("Trying to approve " + amount + " to " + spender);
      const transaction = await this.deployed.approve(Web3.utils.toChecksumAddress(spender), amount, {from: this.account});
      if (!transaction) {
        this.setStatusFailure('Approving Failed.');
      } else {
        this.setStatusSuccess(amount + ' Tokens approved to ' + spender);
      }
    } catch (e) {
      this.showError(e);
    }
    this.updateRolesAndBalance();
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
      this.updateRolesAndBalance();
    });
  }

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

  ngOnDestroy() {
    this.sub.unsubscribe();
  }


}
