import { Component } from '@angular/core';
import { Http, Headers} from '@angular/http';
import { environment } from '../environments/environment';

 
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  searchquery = '';
  tweetsdata;
  enableSearch = false;
  enableFailed = false;
  headers = new Headers();
  
  constructor(private http: Http){}
  
  ngOnInit() {
    
    this.headers.append('Content-Type', 'application/X-www-form-urlencoded');    
    this.http.post(environment.apiUrl+'authorize', {headers: this.headers}).subscribe((res) => {
      if(res.ok == true){
        this.enableSearch = true;
      }else{
        this.enableFailed = true;
      }
    })
  }
  searchcall(){
    if(this.searchquery!=''){
      var searchterm = 'query=' + this.searchquery;
      this.headers.append('Content-Type', 'application/X-www-form-urlencoded');
      
      this.http.post(environment.apiUrl+'search', searchterm, {headers: this.headers}).subscribe((res) => {
        this.tweetsdata = res.json().data.statuses;
        console.log(this.tweetsdata);
      });  
    } else {
      alert('Please enter hashtag');
    }
    
  }
}