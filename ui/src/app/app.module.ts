import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import {MetaModule} from './meta/meta.module';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  MatButtonModule,
  MatCardModule, MatChipsModule, MatExpansionModule,
  MatFormFieldModule, MatIconModule,
  MatInputModule, MatMenuModule,
  MatToolbarModule
} from '@angular/material';
import { HeaderComponent } from './header/header.component';
import {AppRoutingModule} from "./app-routing/app-routing.module";
import {RegistryModule} from "./registry/registry.module";
import {RouterModule} from "@angular/router";
import {KycModule} from "./kyc/kyc.module";
import {TokenModule} from "./token/token.module";
import {ControllerModule} from "./controller/controller.module";
import {InsiderListModule} from "./insiderlist/insiderList.module";
import {PepListModule} from "./peplist/pepList.module";

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
  ],
  imports: [
    BrowserAnimationsModule,
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatToolbarModule,
    BrowserModule,
    FormsModule,
    HttpClientModule,
    RouterModule,
    AppRoutingModule,
    MetaModule,
    RegistryModule,
    KycModule,
    InsiderListModule,
    PepListModule,
    TokenModule,
    ControllerModule,
    MatMenuModule,
    MatIconModule,
    MatExpansionModule,
    MatChipsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
