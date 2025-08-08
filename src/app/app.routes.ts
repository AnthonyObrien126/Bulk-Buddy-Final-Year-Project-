import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register.component';
import { MyCollectionComponent } from './pages/my-collection/my-collection.component';
import { MyDecksComponent } from './pages/my-decks/my-decks.component';
import { DeckDetailComponent } from './pages/deck-detail.component';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', component: RegisterComponent },
  { path: 'cards', loadComponent: () => import('./pages/card-browser/card-browser.component').then(m => m.CardBrowserComponent) },
  { path: 'cards/:id',loadComponent: () => import('./pages/card-detail/card-detail.component').then(m => m.CardDetailComponent)},
  { path: 'my-collection', component: MyCollectionComponent },
  { path: 'my-decks', component: MyDecksComponent },
  { path: '**', redirectTo: 'home' },
  { path: 'my-decks/:deckId', component: DeckDetailComponent }

];
