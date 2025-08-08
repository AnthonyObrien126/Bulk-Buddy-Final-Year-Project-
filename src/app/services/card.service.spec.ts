import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Card {
  _id: string;
  name: string;
  type_line: string;
  rarity: string;
  set: string;
  image_url: string;
  mana_cost: string;
  colors: string[];
  oracle_text: string;
}

@Injectable({
  providedIn: 'root'
})
export class CardService {
  private apiUrl = 'http://localhost:3000/cards';

  constructor(private http: HttpClient) {}

  getCards(name?: string): Observable<{ results: Card[] }> {
    let params = new HttpParams();
    if (name) params = params.set('name', name);

    return this.http.get<{ results: Card[] }>(this.apiUrl, { params });
  }
}
