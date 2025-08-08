import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, PieController, ArcElement, Tooltip, Legend } from 'chart.js';

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  PieController,
  ArcElement,
  Tooltip,
  Legend
);


@Component({
  selector: 'app-deck-stats',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './deck-stats.component.html'
})


export class DeckStatsComponent implements OnInit {

  @Input() deck: any;

  userId: string = '';
  estimatedValue = 0;

  colourCounts: any = {
    White: 0, Blue: 0, Black: 0, Red: 0, Green: 0, Colourless: 0
  };
  rarityCounts: any = {
    common: 0, uncommon: 0, rare: 0, mythic: 0
  };

  manaCurveLabels: string[] = ['1', '2', '3', '4', '5', '6', '7', '8+'];
  manaCurveDatasets = [
    {
      data: [0, 0, 0, 0, 0, 0, 0, 0],
      label: 'Card Count',
      backgroundColor: '#4F46E5',  // Indigo-600 Tailwind (Nice Purple)
      borderRadius: 4,             
      borderSkipped: false         
    }
  ];


  colorPieLabels: string[] = ['White', 'Blue', 'Black', 'Red', 'Green', 'Colourless'];

  colorPieDatasets = [
    {
      data: [0, 0, 0, 0, 0, 0],
      backgroundColor: [
        '#FFFFFF',  // White
        '#1E88E5',  // Blue
        '#000000',  // Black
        '#D32F2F',  // Red
        '#388E3C',  // Green
        '#A9A9A9'   // Colourless
      ],
      label: 'Colours'
    }
  ];


  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    if (!this.deck) return;

    const user = this.authService.getUser();
    if (!user) return;

    this.userId = user.id;

    this.calculateDeckStats();
    this.calculateManaCurve();
    this.calculateColorBreakdown();
  }

  calculateDeckStats(): void {
    this.deck.cards.forEach((c: any) => {
      const qty = c.quantity;
      const card = c.card_id;

      // Value
      const price = parseFloat(card.price_usd || '0');
      this.estimatedValue += price * qty;

      // Colours
      const colors = card.colors || [];
      if (colors.length === 0) {
        this.colourCounts.Colourless += qty;
      } else {
        colors.forEach((color: string) => {
          if (color === 'W') this.colourCounts.White += qty;
          if (color === 'U') this.colourCounts.Blue += qty;
          if (color === 'B') this.colourCounts.Black += qty;
          if (color === 'R') this.colourCounts.Red += qty;
          if (color === 'G') this.colourCounts.Green += qty;
        });
      }

      // Rarity
      const rarity = card.rarity || 'common';
      if (this.rarityCounts[rarity] !== undefined) {
        this.rarityCounts[rarity] += qty;
      }
    });
  }

  calculateManaCurve(): void {
    this.manaCurveDatasets[0].data = [0, 0, 0, 0, 0, 0];  // Reset array
    this.deck.cards.forEach((c: any) => {
      const qty = c.quantity;
      const manaCost = c.card_id.mana_cost;

      if (!manaCost || typeof manaCost !== 'string') return;

      const numericCost = manaCost.replace(/[^\d]/g, '');
      const cmc = parseInt(numericCost || '0', 10);

      if (isNaN(cmc)) return;

      if (cmc >= 5) {
        this.manaCurveDatasets[0].data[5] += qty;
      } else {
        this.manaCurveDatasets[0].data[cmc] += qty;
      }
    });
  }

  calculateColorBreakdown(): void {
    this.colorPieDatasets[0].data = [0, 0, 0, 0, 0, 0]; // W, U, B, R, G, Colourless
    this.deck.cards.forEach((c: any) => {
      const qty = c.quantity;
      const colors = c.card_id.colors || [];

      if (colors.length === 0) {
        this.colorPieDatasets[0].data[5] += qty; // Colourless
      } else {
        colors.forEach((color: string) => {
          if (color === 'W') this.colorPieDatasets[0].data[0] += qty;
          if (color === 'U') this.colorPieDatasets[0].data[1] += qty;
          if (color === 'B') this.colorPieDatasets[0].data[2] += qty;
          if (color === 'R') this.colorPieDatasets[0].data[3] += qty;
          if (color === 'G') this.colorPieDatasets[0].data[4] += qty;
        });
      }
    });
  }

}
