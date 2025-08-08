import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CollectionService {
  private apiUrl = 'http://localhost:5000/api/collections';

  constructor(private http: HttpClient) {}

  addToCollection(payload: any): Observable<any> {
    return this.http.post('http://localhost:5000/api/collections', payload);
  }  
}
