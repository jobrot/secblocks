import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegistryComponent } from './registry/registry.component';
import {MetaSenderComponent} from "../meta/meta-sender/meta-sender.component";


@NgModule({
  declarations: [RegistryComponent],
  //entryComponents: [RegistryComponent],
  imports: [
    CommonModule
  ]
})
export class RegistryModule { }
