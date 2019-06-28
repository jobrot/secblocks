import {Component, OnDestroy, OnInit} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-kyc',
  templateUrl: './kyc.component.html',
  styleUrls: ['./kyc.component.css']
})
export class KycComponent implements OnInit, OnDestroy  {
  address: string;
  sub: any;

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
     this.sub = this.route.params.subscribe(params => {
      this.address = ''+params['address'];
    });
  }


  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
