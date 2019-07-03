import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InsiderListComponent } from './insiderList/insiderList.component';
import {
  MatButtonModule,
  MatCardModule,
  MatFormFieldModule, MatIconModule,
  MatInputModule,
  MatListModule,
  MatSelectModule
} from "@angular/material";
import {FormsModule} from "@angular/forms";

@NgModule({
  declarations: [InsiderListComponent],
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    MatSelectModule,
    MatListModule,
    MatIconModule
  ]
})
export class InsiderListModule { }
