import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  constructor(public authService: AuthService) {}
  loggedIn: boolean = false;
  
  randomMessage: string = '';

  ngOnInit(): void {
    this.loggedIn = this.authService.isLoggedIn();
  }

  quotes: string[] = [
    "Tap, Draw, Win!",
    "May your mana never screw you.",
    "Every deck tells a story.",
    "Sometimes you top deck like a god.",
    "Bulk today... Treasure tomorrow.",
    "Trust the heart of the cards.",
    "Play fair... or don't.",
    "In cardboard we trust.",
  ];

  showRandomMessage() {
    const index = Math.floor(Math.random() * this.quotes.length);
    this.randomMessage = this.quotes[index];
  }

}



