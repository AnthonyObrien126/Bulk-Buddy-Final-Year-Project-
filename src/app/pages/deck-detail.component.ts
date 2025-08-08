import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DeckService } from '../services/deck.service';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardService } from '../services/card.service';
import { DeckStatsComponent } from '../components/deck-stats/deck-stats.component';
import { RouterLink } from '@angular/router';



@Component({
  selector: 'app-deck-detail',
  imports: [CommonModule, FormsModule, DeckStatsComponent, RouterLink],
  templateUrl: './deck-detail.component.html',
  styleUrls: ['./deck-detail.component.scss']
})

export class DeckDetailComponent implements OnInit {
  deck: any;
  loading = true;
  groupedCards: any;
  groupedSideboard: any;
  hoveredImage: string | null = null;
  showAddCardForm = false;
  newCardname = '';
  newCardQuantity = 1;
  deckId!: string;
  newCardId: string = '';
  searchResults: any[] = [];
  searchQuery: string = '';
  selectedCard: any = null;
  editMode: boolean = false;
  hoveredCardId: string | null = null;


  
  constructor(
    private route: ActivatedRoute,
    private deckService: DeckService,
    private cardService: CardService,
    public location: Location
  ) {}

  ngOnInit(): void {
    this.deckId = this.route.snapshot.paramMap.get('deckId')!;
    this.loadDeck();
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
  }

  groupCardsByType(cards: any[]): any {
    const groups: { [key: string]: any[] } = {};
  
    cards.forEach(card => {
      if (!card.card_id || !card.card_id.type_line) return;
  
      const typeLine = card.card_id.type_line;
  
      let group = 'Other';
  
      if (typeLine.includes('Creature')) group = 'Creatures';
      else if (typeLine.includes('Artifact')) group = 'Artifacts';
      else if (typeLine.includes('Enchantment')) group = 'Enchantments';
      else if (typeLine.includes('Instant') || typeLine.includes('Sorcery')) group = 'Spells';
      else if (typeLine.includes('Land')) group = 'Lands';
      else if (typeLine.includes('Planeswalker')) group = 'Planeswalkers';
  
      if (!groups[group]) {
        groups[group] = [];
      }
  
      groups[group].push(card);
    });
  
    return groups;
  }
  

  asArray(value: unknown): any[] {
    return value as any[];
  }

  loadDeck() {
    this.loading = true;
  
    this.deckService.getDeckById(this.deckId!).subscribe({
      next: (res: any) => {
        this.deck = res;
        this.groupedCards = this.groupCardsByType(res.cards);
        this.groupedSideboard = this.groupCardsByType(res.sideboard);
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load deck', err);
      }
    });
  }
  
  addCardToDeck() {
    console.log('Attempting to add card to deck...');
    console.log('Selected card:', this.selectedCard);
    console.log('newCardQuantity:', this.newCardQuantity);
  
    if (!this.selectedCard || this.newCardQuantity < 1) {
      alert('Please select a card and enter quantity.');
      return;
    }
  
    // Send full Scryfall card object + quantity
    this.deckService.addCardToDeck(this.deckId, {
      card: this.selectedCard,  // <-- FULL CARD OBJECT
      quantity: this.newCardQuantity
    }).subscribe({
      next: () => {
        this.showAddCardForm = false;
        this.newCardQuantity = 1;
        this.searchQuery = '';
        this.selectedCard = null;  // Reset selectedCard
        this.loadDeck();
      },
      error: (err) => {
        console.error('Failed to add card:', err);
      }
    });
  }

  searchCards() {
    if (!this.searchQuery) return;
  
    this.cardService.searchScryfallAllByName(this.searchQuery).subscribe({
      next: (res: any) => {
        this.searchResults = res.data || []; // Scryfall returns { data: [...] }
      },
      error: (err) => {
        console.error('Failed to search Scryfall:', err);
        this.searchResults = [];
      }
    });
  }
  
  selectCard(card: any) {
    console.log('Selected card:', card);
    this.selectedCard = card;  // Store the full object for backend usage
    this.newCardId = card.id;  // Store the Scryfall ID for safety
    this.newCardname = card.name;     // <- Grab the human-readable name
    this.searchQuery = card.name; // Update the search box display
    this.searchResults = [];
  }
  
  deleteCardFromDeck(card: any) {
    if (confirm(`Remove ${card.card_id.name} from deck?`)) {
      this.deckService.removeCardFromDeck(this.deckId, card.card_id._id).subscribe({
        next: () => this.loadDeck(),
        error: (err) => console.error('Failed to remove card:', err)
      });
    }
  }

  saveDeckChanges() {
    this.deckService.updateDeck(this.deckId, this.deck).subscribe({
      next: (updatedDeck) => {
        this.deck = updatedDeck;
        this.toggleEditMode();
      },
      error: (err) => {
        console.error('Failed to update deck', err);
      }
    });
  }

  logCardId(card: any) {
    console.log('Hovered card:', card.card_id);
    console.log('Generating Scryfall Image for:', card.card_id.scryfall_id);

  }  

  generateScryfallImage(scryfallId: string): string {
    if (!scryfallId) return '';  
  
    const firstChar = scryfallId[0];   // first character
    const secondChar = scryfallId[1];  // second character
  
    return `https://cards.scryfall.io/normal/front/${firstChar}/${secondChar}/${scryfallId}.jpg`;
  }
  
  getTotalCards(cards: any[]): number {
    return cards.reduce((total, card) => total + card.quantity, 0);
  }
  
  
}
