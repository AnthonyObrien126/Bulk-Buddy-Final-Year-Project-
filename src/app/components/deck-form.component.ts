import { Component, EventEmitter, Output } from '@angular/core';
import { DeckService } from '../services/deck.service';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  imports: [
    CommonModule,
    FormsModule
  ],
  selector: 'app-deck-form',
  templateUrl: './deck-form.component.html'
})
export class DeckFormComponent {
  @Output() deckCreated = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  name = '';
  description = '';
  format = 'Commander';

  constructor(
    private deckService: DeckService,
    private authService: AuthService
  ) {}

  createDeck() {
    const user = this.authService.getUser();

    const deckData = {
      user_id: user._id || user.id,
      name: this.name,
      description: this.description,
      format: this.format
    };

    this.deckService.createDeck(deckData).subscribe({
      next: () => {
        this.deckCreated.emit();
        this.close();
      },
      error: err => console.error('Failed to create deck', err)
    });
  }

  close() {
    this.closed.emit();
  }
}
