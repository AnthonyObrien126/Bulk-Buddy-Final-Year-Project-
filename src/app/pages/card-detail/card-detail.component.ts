import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';

@Component({
  selector: 'app-card-detail',
  standalone: true,
  templateUrl: './card-detail.component.html',
  imports: [CommonModule],
})
export class CardDetailComponent implements OnInit {
  card: any;

  constructor(
    private route: ActivatedRoute, 
    private http: HttpClient,
    private location: Location) {}

  ngOnInit(): void {
    const cardId = this.route.snapshot.paramMap.get('id');
    console.log('Route card ID:', cardId);
    this.http.get(`http://localhost:5000/api/cards/${cardId}`).subscribe(data => {
      this.card = data;
      console.log('Fetched card:', data);
    });
  }  
  
  legalFormats(legalities: any): string[] {
    return Object.keys(legalities);
  }
  
  goBack(): void {
    this.location.back();
  }
  
}
