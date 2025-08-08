import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DeckService {

  private apiUrl = 'http://localhost:5000/api/decks';

  constructor(private http: HttpClient) { }

  getUserDecks(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${userId}`);
  }

  createDeck(deckData: any): Observable<any> {
    return this.http.post(this.apiUrl, deckData);
  }

  deleteDeck(deckId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${deckId}`);
  }

  getDeckById(deckId: string) {
    return this.http.get(`${this.apiUrl}/view/${deckId}`);
  }
  
  addCardToDeck(deckId: string, cardData: any) {
    return this.http.post(`${this.apiUrl}/${deckId}/cards`, cardData);
  }

  removeCardFromDeck(deckId: string, cardId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${deckId}/cards/${cardId}`);
  }
  
  updateDeck(deckId: string, deckData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${deckId}`, deckData);
  }

  updateDeckImage(deckId: string, custom_image_url: string) {
    return this.http.patch(`/api/decks/${deckId}/image`, { custom_image_url });
  }  
  
}
