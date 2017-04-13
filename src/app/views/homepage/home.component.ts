import { Component,OnInit } from '@angular/core';

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"] ,
})


export class HomeComponent implements OnInit{
   constructor() {};
   location = {};
   setPosition(position){
      this.location = position.coords;
      console.log(position.coords);
      }
ngOnInit(){
   if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(this.setPosition.bind(this));
      };
   }
}