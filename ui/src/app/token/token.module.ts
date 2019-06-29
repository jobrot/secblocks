import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Erc1594Component } from './erc1594/erc1594.component';
import {
  MatButtonModule,
  MatCardModule, MatExpansionModule,
  MatFormFieldModule, MatIconModule,
  MatInputModule,
  MatListModule,
  MatSelectModule
} from "@angular/material";
import {FormsModule} from "@angular/forms";

@NgModule({
  declarations: [Erc1594Component],
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    MatSelectModule,
    MatListModule,
    MatIconModule,
    MatExpansionModule
  ]
})
export class TokenModule { }
