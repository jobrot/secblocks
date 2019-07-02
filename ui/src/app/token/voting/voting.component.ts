import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {Web3Service} from "../../util/web3.service";
import {MatChipInputEvent, MatSnackBar} from "@angular/material";
import {NgForm} from "@angular/forms";
import {COMMA, ENTER} from '@angular/cdk/keycodes';

const abi = require('ethereumjs-abi');
const Web3 = require('web3');
//const { BN } = require('openzeppelin-test-helpers'); //TODO


declare let require: any; //declares that require in code is defined by external component, in this case web3.service
const dividendToken_artifacts = require('../../../../../build/contracts/VotingToken.json');

type Ballot = { name: string, endDate: Date, optionNames: string[], optionVoteCounts: number[] };

@Component({
  selector: 'app-voting',
  templateUrl: './voting.component.html',
  styleUrls: ['./voting.component.css']
})
export class VotingComponent implements OnInit {
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  address: string;
  sub: any;

  dividendToken: any;
  deployed: any;
  isIssuer: boolean;
  /*  isOrchestrator: boolean;*/
  account: string;
  /*  name: string;*/
  optionNames: string[] = [];

  ballots: Ballot[] = [];

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
            this.checkRole();
          });

          this.updateBallots();

        });

      });

  }


  async createBallot(createForm: NgForm) {
    if (!createForm.valid) {
      this.setStatusFailure('Form invalid');
    }
    if (!this.deployed) {
      this.setStatusFailure('contract is not loaded, unable to send');
      return;
    }
    let ballotName = createForm.value.name;
    let endTime = new Date(createForm.value.endTime);
    console.log("form:");

    try {
      console.log("Trying to create " + ballotName + " Ballot with endtime " + endTime.getTime() / 1000); //endTime.getTime()/1000
      let bytes32OptionNames = [];
      this.optionNames.forEach(name => {
        bytes32OptionNames.push(Web3.utils.fromAscii(name));
      });

      const transaction = await this.deployed.createBallot(Web3.utils.fromAscii(ballotName), bytes32OptionNames, (endTime.getTime() / 1000), {from: this.account});
      console.log("transaction:");
      console.log(transaction);
      if (!transaction) {
        this.setStatusFailure('Creating Failed.');
      } else {
        this.setStatusSuccess(ballotName + ' Ballot created.');
      }
    } catch (e) {
      this.showError(e);
    }
    this.updateBallots();
  }

  async updateBallots() {
    console.log("Updating Ballots..");

    const deployed = this.deployed;
    /*let ballot = await deployed.ballots.call(10, {from: this.account});
    let optionNames = await deployed.getOptionNames.call(0, {from: this.account});
    let optionVoteCounts = await deployed.getOptionVoteCounts.call(0, {from: this.account});*/

    this.ballots = [];
    for (var i = 0; ; i++) {
      try {
        let ballot = (await deployed.ballots.call(i, {from: this.account}));
        let optionNames = (await deployed.getOptionNames.call(0, {from: this.account})).map(Web3.utils.toUtf8);
        let optionVoteCounts = await deployed.getOptionVoteCounts.call(0, {from: this.account});
        let ballotname = Web3.utils.toUtf8(ballot.name)
        console.log(ballotname);
        console.log(new Date(ballot.endDate.toNumber()));
        console.log(optionNames);
        console.log(optionVoteCounts);
        this.ballots.push({name: ballotname, endDate: new Date(ballot.endDate.toNumber()), optionNames: optionNames, optionVoteCounts: optionVoteCounts});
      } catch (e) {
        break;
      }
    }


  }


  async vote(voteForm: NgForm) {
    if (!voteForm.valid) {
      this.setStatusFailure('Form invalid');
    }
    if (!this.deployed) {
      this.setStatusFailure('contract is not loaded, unable to send');
      return;
    }
    let ballotName = voteForm.value.ballotName;
    let optionName = voteForm.value.optionName;

    try {
      console.log("Trying to send vote for " + optionName + " in " + ballotName);
      const transaction = await this.deployed.vote(Web3.utils.fromAscii(ballotName), Web3.utils.fromAscii(optionName), {from: this.account});
      if (!transaction) {
        this.setStatusFailure('Voting Failed.');
      } else {
        this.setStatusSuccess('Voting for ' + optionName + ' successful.');
      }
    } catch (e) {
      this.showError(e);
    }
  }

  async currentlyWinningOption(form: NgForm) {
    if (!form.valid) {
      this.setStatusFailure('Form invalid');
    }
    if (!this.deployed) {
      this.setStatusFailure('contract is not loaded, cannot calculate winning Option');
      return;
    }

    let ballotName = form.value.ballotName;

    try {
      console.log("Trying to check winning option of " + ballotName);
      const result = await this.deployed.currentlyWinningOption.call(Web3.utils.fromAscii(ballotName), {from: this.account});
      if (!result) {
        this.setStatusFailure('Checking Failed.');
      } else if (result[1] <= 0) {
        this.setStatusFailure(Web3.utils.toUtf8(result[0]));
      } else {
        this.setStatus('Option ' + Web3.utils.toUtf8(result[0]) + ' is currently winning with ' + result[1] + ' votes.');
      }
    } catch (e) {
      this.showError(e);
    }
  }


  addChip(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    if ((value || '').trim()) {
      this.optionNames.push(value.trim());
    }

    if (input) {
      input.value = '';
    }
  }

  removeChip(optionName: string): void {
    const index = this.optionNames.indexOf(optionName);

    if (index >= 0) {
      this.optionNames.splice(index, 1);
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
      this.checkRole();
    });
  }

  checkRole() {
    console.log("CheckingRole..");
    if (this.account) {
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
