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
  private apiUrl = 'http://localhost:5000/api/cards';

  constructor(private http: HttpClient) {}

  getCards(filters: { 
    name?: string; 
    rarity?: string; 
    type_line?: string; 
    colors?: string[];
    colorless?: boolean;
    page?: number; 
    limit?: number; 
  } = {}): Observable<{
    results: Card[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    let params = new HttpParams();
  
    if (filters.name) params = params.set('name', filters.name);
    if (filters.rarity) params = params.set('rarity', filters.rarity);
    if (filters.type_line) params = params.set('type_line', filters.type_line);
    if (filters.colorless) {
      params = params.set('colorless', 'true');
    } else if (filters.colors?.length) {
      params = params.set('colors', filters.colors.join(','));
    }
    
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
  
    return this.http.get<{
      results: Card[];
      total: number;
      page: number;
      totalPages: number;
    }>(this.apiUrl, { params });
  }

  searchScryfallByName(name: string): Observable<any> {
    return this.http.get<any>(`http://localhost:5000/api/cards/scryfall/search?name=${encodeURIComponent(name)}`);
  }  

  searchScryfallAllByName(name: string) {
    return this.http.get<any>(`http://localhost:5000/api/cards/scryfall/search-all?name=${encodeURIComponent(name)}`);
  }
  
  importCardById(id: string): Observable<Card> {
    return this.http.get<Card>(`${this.apiUrl}/import/${id}`);
  }

  searchCardsByName(name: string) {
    return this.http.get(`/api/cards/search/${name}`);
  }      
  
  addToCollection(payload: any) {
    return this.http.post(`http://localhost:5000/api/collections`, payload);
  } 
  
  searchExactCard(name: string, set: string) {
    const url = `http://localhost:5000/api/cards/scryfall/search?name=${encodeURIComponent(name)}&set=${encodeURIComponent(set)}`;
    return this.http.get<any>(url);
  }

  updateCollectionEntry(entryId: string, payload: any) {
    return this.http.patch(`http://localhost:5000/api/collections/${entryId}`, payload);
  }
  
  deleteCollectionEntry(entryId: string) {
    return this.http.delete(`http://localhost:5000/api/collections/${entryId}`);
  }

  importCardFromScryfall(scryfallId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/import/${scryfallId}`);
  }
  

}
