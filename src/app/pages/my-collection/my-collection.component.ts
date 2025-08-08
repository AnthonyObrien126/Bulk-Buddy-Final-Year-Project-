import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { AuthService } from '../../services/auth.service';
import { CardService } from '../../services/card.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSnackBarModule, MatSnackBar} from '@angular/material/snack-bar';


@Component({
  selector: 'app-my-collection',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatSnackBarModule],
  templateUrl: './my-collection.component.html'
})

export class MyCollectionComponent implements OnInit {
  userId: string = '';
  collection: any[] = [];
  errorMessage: string = '';
  searchTerm: string = '';
  searchResults: any = [];
  selectedCard: any = null;
  scryfallResult: any = null;
  scryfallName: string = '';
  scryfallError: string = '';
  searchName = '';
  searchSet = '';
  setName: string = '';
  fullCollection: any[] = [];
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
    colors: [],
  };
  

collectionStats = {
  totalQuantity: 0,
  uniqueCount: 0,
  colorCounts: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 },
  rarityCounts: {} as Record<string, number>,
  valueUSD: 0,
  valueUSDFoil: 0
};


page: number = 1;
pageSize: number = 10;
totalPages: number = 1;

readonly colorKeys: (keyof typeof this.collectionStats.colorCounts)[] = ['W', 'U', 'B', 'R', 'G', 'C'];

newEntry = {
  quantity: 1,
  notes: '',
  acquired_date: ''
};

constructor(
  private authService: AuthService,
  private cardService: CardService,
  private http: HttpClient,
  private snackBar: MatSnackBar
) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (!user) {
      return;
    }

    this.userId = this.authService.getUser().id;
    this.fetchCollection();
    this.applyFilters();
  }

  addToCollection() {
    const payload = {
      user_id: this.authService.getUser().id,
      card_id: this.selectedCard._id,
      ...this.newEntry
    };
  
    // Log the user_id, card_id, and payload
    console.log('User ID:', this.authService.getUser().id);
    console.log('Card ID:', this.selectedCard._id);
    console.log('Payload:', payload);
  
    this.cardService.addToCollection(payload).subscribe({
      next: (res) => {
        console.log('Card added to collection:', res);
  
        this.snackBar.open('Card added to your collection!', 'Close', {
          duration: 3000, // 3 seconds
          panelClass: ['bg-green-500', 'text-white'] // Optional Tailwind styling
        });
  
        this.page = 1; 
        this.fetchCollection(); 
      },
      error: (err) => {
        console.error('Error adding card to collection:', err);
  
        this.snackBar.open('Error adding card', 'Close', {
          duration: 3000,
          panelClass: ['bg-red-500', 'text-white']
        });
      }
    });
  }
    
  onSearchClick() {
    if (this.searchTerm.length < 3 || !this.setName) {
      this.searchResults = [];
      this.scryfallResult = null;
      this.scryfallError = 'Please provide both a valid card name and set.';
      return;
    }
  
    console.log(this.searchResults);
  
    // Step 1: Search local DB
    this.cardService.searchCardsByName(this.searchTerm).subscribe({
      next: (res) => {
        this.searchResults = res;
  
        // Step 2: If nothing found, fallback to Scryfall
        if (!this.searchResults.length) {
          this.cardService.searchExactCard(this.searchTerm, this.setName).subscribe({
            next: (card) => {
              this.scryfallResult = card;
              this.scryfallError = ''; // Clear any previous errors
            },
            error: (err) => {
              if (err.status === 404) {
                this.scryfallError = 'Card not found or the set is incorrect. Please check the card name and set.';
              } else {
                this.scryfallError = 'Error during search. Please try again later.';
              }
              this.scryfallResult = null;
            }
          });
        } else {
          this.scryfallResult = null;
          this.scryfallError = ''; // Clear any previous errors
        }
      },
      error: () => {
        this.searchResults = [];
        this.scryfallResult = null;
        this.scryfallError = 'Error during search. Please try again later.';
      }
    });
  }
  
  selectCard(card: any) {
    this.selectedCard = card;
  }

  fetchCollection() {
    this.authService.getUserCollection().subscribe({
      next: (data) => {
        // Prepare data for both filtering and editing
        this.fullCollection = data.map(entry => ({
          ...entry,
          isEditing: false,
          editValues: {
            quantity: entry.quantity,
            notes: entry.notes
          }
        }));
  
        this.collection = [...this.fullCollection];
      },
      error: (err) =>
        this.errorMessage = err.error?.error || 'Failed to load collection',
    });
  }  
  
  importCard(scryfallId: string): void {
    this.cardService.importCardById(scryfallId).subscribe({
      next: (card) => {
        this.searchTerm = '';
        this.searchResults = [];
        this.scryfallResult = null;
        this.selectedCard = card;
        this.fetchCollection(); 
      },
      error: (err) => {
        if (err.status === 409) {
          this.scryfallError = 'Card already exists in the database.';
        } else {
          console.error('Import failed:', err);
          this.scryfallError = 'Failed to import card.';
        }
      }
    });
  }      

  searchScryfallCard(): void {
    this.scryfallError = '';
    this.scryfallResult = null;
  
    if (!this.scryfallName) return;
  
    this.cardService.searchScryfallByName(this.scryfallName).subscribe({
      next: (card) => this.scryfallResult = card,
      error: () => this.scryfallError = 'Card not found on Scryfall'
    });
  }
  
  onSearchExact(): void {
    this.scryfallResult = null;
    this.scryfallError = '';
  
    if (!this.searchName || !this.searchSet) {
      this.scryfallError = 'Both card name and set are required';
      return;
    }
  
    this.cardService.searchExactCard(this.searchName, this.searchSet).subscribe({
      next: (card) => this.scryfallResult = card,
      error: (err) => {
        console.error(err);
        this.scryfallError = 'Card not found in that set';
      }
    });
  }
  
  applyFilters(resetPage: boolean = true): void {
    if (resetPage) {
      this.page = 1;
    }
    this.runFilters();
  }  
  
  runFilters(): void {
    const filtered = this.fullCollection.filter(entry => {
      const card = entry.card_id;
  
      if (this.filters.name && !card.name.toLowerCase().includes(this.filters.name.toLowerCase())) return false;
      if (this.filters.rarity && card.rarity !== this.filters.rarity) return false;
      if (this.filters.type_line && !card.type_line.includes(this.filters.type_line)) return false;
      if (this.filters.colorless && card.colors.length > 0) return false;
      if (this.filters.colors.length > 0 && !this.filters.colors.every(c => card.colors.includes(c))) return false;
  
      return true;
    });
  
    console.log('✅ Filtered cards passed to stats:', filtered);
  
    this.collectionStats = this.calculateStats(filtered);

  
    this.totalPages = Math.ceil(filtered.length / this.pageSize);
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
  
    this.collection = filtered.slice(start, end);
  }

  toggleColor(color: string, checked: boolean): void {
  if (color === 'C') {
    this.filters.colorless = checked;
    return;
  }

  if (checked) {
    this.filters.colors.push(color);
  } else {
    this.filters.colors = this.filters.colors.filter(c => c !== color);
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

  viewMode: 'grid' | 'list' = 'grid';

  saveEntryChanges(entry: any): void {
    const payload = {
      quantity: entry.editValues.quantity,
      notes: entry.editValues.notes
    };
    
    console.log('Saving entry ID:', entry._id);
    console.log('Payload:', payload);

    this.cardService.updateCollectionEntry(entry._id, payload).subscribe({
      next: () => {
        entry.quantity = payload.quantity;
        entry.notes = payload.notes;
        entry.isEditing = false;
      },
      error: (err) => {
        console.error('Failed to update entry:', err);
      }
    });
  }  
  
  cancelEdit(entry: any): void {
    entry.editValues.quantity = entry.quantity;
    entry.editValues.notes = entry.notes;
    entry.isEditing = false;
  }
  
  deleteEntry(entry: any): void {
    if (!confirm(`Are you sure you want to remove "${entry.card_id.name}" from your collection?`)) {
      return;
    }
  
    this.cardService.deleteCollectionEntry(entry._id).subscribe({
      next: () => {
        this.collection = this.collection.filter(e => e._id !== entry._id);
        this.fullCollection = this.fullCollection.filter(e => e._id !== entry._id);
      },
      error: (err) => {
        console.error('Failed to delete entry:', err);
      }
    });
  }
  
  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.applyFilters(false); // Don't reset page
    }
  }
  
  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.applyFilters(false); // Don't reset page
    }
  }
  

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  calculateStats(filtered: any[]): any {
    const stats = {
      totalQuantity: 0,
      uniqueCount: filtered.length,
      colorCounts: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 },
      rarityCounts: {} as Record<string, number>,
      valueUSD: 0,          // Non-foil value
      valueUSDFoil: 0       // Foil value
    };
  
    for (const entry of filtered) {
      const card = entry.card_id;
      const qty = entry.quantity;
  
      stats.totalQuantity += qty;

      // Value tracking
      const usd = parseFloat(card.price_usd || '0');
      const foil = parseFloat(card.price_usd_foil || '0');
  
      stats.valueUSD += usd * qty;
      stats.valueUSDFoil += foil * qty;
  
      // Colors
      if (card.colors && card.colors.length > 0) {
        for (const color of card.colors) {
          const key = color as keyof typeof stats.colorCounts;
          if (stats.colorCounts[key] !== undefined) {
            stats.colorCounts[key] += qty;
          }
        }
      } else {
        stats.colorCounts.C += qty;
      }
  
      // Rarities
      const rarity = card.rarity || 'unknown';
      stats.rarityCounts[rarity] = (stats.rarityCounts[rarity] || 0) + qty;
    }
  
    return stats;
  }

  exportCollection() {
    this.http.get(`http://localhost:5000/api/collections/${this.userId}/export/text`, { responseType: 'text' })
      .subscribe({
        next: (data: string) => {
          const blob = new Blob([data], { type: 'text/plain' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
  
          const date = new Date().toISOString().split('T')[0];
          a.download = `bulkbuddy-collection-${date}.txt`;
  
          a.click();
          window.URL.revokeObjectURL(url);
  
          this.snackBar.open('Collection exported successfully!', 'Close', { duration: 3000, horizontalPosition: 'right',
            verticalPosition: 'top'});
        },
        error: () => {
          this.snackBar.open('Failed to export collection.', 'Close', { duration: 3000, horizontalPosition: 'right',
            verticalPosition: 'top' });
        }
      });
  }
    
}

