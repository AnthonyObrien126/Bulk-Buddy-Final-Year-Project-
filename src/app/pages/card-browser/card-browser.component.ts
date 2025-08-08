import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardService, Card } from '../../services/card.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  trigger,
  style,
  transition,
  animate,
  query,
  stagger
} from '@angular/animations';


@Component({
  standalone: true,
  selector: 'app-card-browser',
  templateUrl: './card-browser.component.html',
  styleUrls: ['./card-browser.component.scss'],
  imports: [CommonModule, FormsModule, RouterModule],
  animations: [
    trigger('cardFade', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'scale(0.95)' }),
          stagger(100, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})

export class CardBrowserComponent implements OnInit {
  cards: Card[] = [];
  loading = true;

  filters: {
    name: string;
    rarity: string;
    type_line: string;
    colors: string[];
    colorless?: boolean;
  } = {
    name: '',
    rarity: '',
    type_line: '',
    colors: []
  };
  

  page = 1;
  totalPages = 1;

  constructor(private cardService: CardService) {}

  ngOnInit(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    this.loading = true;

    this.cardService.getCards({
      ...this.filters,
      page: this.page,
      limit: 24
    }).subscribe(res => {
      this.cards = res.results;
      this.totalPages = res.totalPages;
      this.loading = false;
    }, err => {
      console.error(err);
      this.loading = false;
    });
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.applyFilters();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.applyFilters();
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

scryfallResult: any = null;
scryfallName = '';
scryfallError = '';

searchScryfallCard(): void {
  this.scryfallError = '';
  this.scryfallResult = null;

  if (!this.scryfallName) return;

  this.cardService.searchScryfallByName(this.scryfallName).subscribe({
    next: (card) => this.scryfallResult = card,
    error: () => this.scryfallError = 'Card not found on Scryfall'
  });
}

importCard(scryfallId: string): void {
  this.cardService.importCardById(scryfallId).subscribe({
    next: () => {
      this.scryfallResult = null;
      this.scryfallName = '';
      this.scryfallError = '';
      this.page = 1;
      this.applyFilters();
    },
    error: (err) => {
      console.error('Import failed:', err);
      this.scryfallError = 'Failed to import card.';
    }
  });
}

toggleColor(colorCode: string, checked: boolean | null | undefined): void {
  if (colorCode === 'C') {
    this.filters.colorless = !!checked; // true if checked, false if unchecked
    return;
  }

  if (checked) {
    if (!this.filters.colors.includes(colorCode)) {
      this.filters.colors.push(colorCode);
    }
  } else {
    this.filters.colors = this.filters.colors.filter(c => c !== colorCode);
  }
}


availableColors: { code: string, label: string }[] = [
  { code: 'W', label: 'White' },
  { code: 'U', label: 'Blue' },
  { code: 'B', label: 'Black' },
  { code: 'R', label: 'Red' },
  { code: 'G', label: 'Green' },
  { code: 'C', label: 'Colourless' }
];


}

