import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import {RegistryComponent} from "../registry/registry/registry.component";
import {KycComponent} from "../kyc/kyc/kyc.component";
import {Erc1594Component} from "../token/erc1594/erc1594.component";
import {DividendComponent} from "../token/dividend/dividend.component";
import {VotingComponent} from "../token/voting/voting.component";
import {ControllerComponent} from "../controller/controller/controller.component";
import {InsiderListComponent} from "../insiderlist/insiderList/insiderList.component";
import {PepListComponent} from "../peplist/pepList/pepList.component";

const routes: Routes = [
  {
    path: 'registry',
    component: RegistryComponent
  },
  {
    path: 'kyc/:address',
    component: KycComponent
  },
  {
    path: 'ins/:address',
    component: InsiderListComponent
  },
  {
    path: 'pep/:address',
    component: PepListComponent
  },
  {
    path: 'erc1594/:address',
    component: Erc1594Component
  },
  {
    path: 'dividendToken/:address',
    component: DividendComponent
  },
  {
    path: 'votingToken/:address',
    component: VotingComponent
  },
  {
    path: 'controller/:address',
    component: ControllerComponent
  },
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
