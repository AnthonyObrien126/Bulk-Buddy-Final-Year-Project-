import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';



@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = 'http://localhost:5000/auth';
  private tokenKey = 'token';
  public isLoggedIn$ = new BehaviorSubject<boolean>(this.hasToken());


  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/login`, { email, password }).pipe(
      tap(response => {
        localStorage.setItem(this.tokenKey, response.token);
        localStorage.setItem('user', JSON.stringify(response.user)); // Store user with ID
        this.isLoggedIn$.next(true); 
      })
      
    );
  }
  
  register(email: string, password: string) {
    return this.http.post<{ message: string }>(`${this.baseUrl}/register`, { email, password });
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
  

  logout() {
    this.isLoggedIn$.next(false);
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('user');
  }
  
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getUserCollection(): Observable<any[]> {
    const token = this.getToken();
    const user = this.getUser();
  
    return this.http.get<any[]>(`http://localhost:5000/api/collections/${user.id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  checkLoginStatus(): void {
    const loggedIn = !!localStorage.getItem(this.tokenKey);
    this.isLoggedIn$.next(loggedIn);
  }
  

}
