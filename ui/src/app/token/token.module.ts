import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Erc1594Component } from './erc1594/erc1594.component';
import {
  MatButtonModule,
  MatCardModule, MatChipsModule, MatExpansionModule,
  MatFormFieldModule, MatIconModule,
  MatInputModule,
  MatListModule,
  MatSelectModule
} from "@angular/material";
import {FormsModule} from "@angular/forms";
import { DividendComponent } from './dividend/dividend.component';
import { VotingComponent } from './voting/voting.component';

@NgModule({
  declarations: [Erc1594Component, DividendComponent, VotingComponent],
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
    MatExpansionModule,
    MatChipsModule
  ]
})
export class TokenModule { }
