import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MetaModule } from '../meta/meta.module'
import {RegistryModule} from "../registry/registry.module";
import {MetaSenderComponent} from "../meta/meta-sender/meta-sender.component";
import {RegistryComponent} from "../registry/registry/registry.component";
import {KycComponent} from "../kyc/kyc/kyc.component";

const routes: Routes = [
  {
    path: 'meta-sender',
    component: MetaSenderComponent
  },
  {
    path: 'registry',
    component: RegistryComponent
  },
  {
    path: 'kyc/:address',
    component: KycComponent
  }
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
