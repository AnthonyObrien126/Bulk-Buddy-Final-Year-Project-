import { Component, OnInit } from '@angular/core';
import { DeckService } from '../../services/deck.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeckFormComponent } from '../../components/deck-form.component';
import { RouterModule } from '@angular/router'

@Component({
  selector: 'app-my-decks',
  templateUrl: './my-decks.component.html',
  imports: [CommonModule, FormsModule, DeckFormComponent, RouterModule],
  styleUrls: ['./my-decks.component.scss']
})
export class MyDecksComponent implements OnInit {

  showForm = false;
  decks: any[] = [];
  userId: string | null = null;

  constructor(
    private deckService: DeckService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const user = this.authService.getUser();
    console.log('Loaded User:', user);
  
    this.userId = user?._id || user?.id; 
  
    console.log('Using userId for deck fetch:', this.userId);
  
    if (this.userId) {
      this.loadDecks();
    }
  }
  

  loadDecks(): void {
    this.deckService.getUserDecks(this.userId!).subscribe({
      next: (res) => {
        this.decks = res;
      },
      error: (err) => {
        console.error('Failed to load decks', err);
      }
    });
  }

  deleteDeck(deckId: string): void {
    if (!confirm('Are you sure you want to delete this deck?')) return;

    this.deckService.deleteDeck(deckId).subscribe({
      next: () => this.loadDecks(),
      error: (err) => console.error('Failed to delete deck', err)
    });
  }

  getDeckCardCount(deck: any): number {
    return deck.cards.reduce((total: number, card: any) => total + card.quantity, 0);
  }

  updateDeckImage(deck: any) {
    this.deckService.updateDeckImage(deck._id, deck.custom_image_url).subscribe({
      next: () => this.loadDecks(),
      error: (err) => console.error('Failed to update deck image', err)
    });
  }
  
  
}
