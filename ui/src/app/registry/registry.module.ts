import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegistryComponent } from './registry/registry.component';
import {MatCardModule, MatFormFieldModule, MatIconModule, MatListModule, MatSelectModule} from "@angular/material";


@NgModule({
  declarations: [RegistryComponent],
  //entryComponents: [RegistryComponent],
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatListModule,
    MatIconModule
  ]
})
export class RegistryModule { }
