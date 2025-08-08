import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dark-toggle', // Component selector for usage in templates
  standalone: true, // Standalone component (no module required)
  imports: [CommonModule], // Import Angular CommonModule
  template: `
    <button (click)="toggleDarkMode()" class="text-sm px-4 py-2 rounded shadow bg-gray-200 dark:bg-gray-700 dark:text-white transition">
      {{ isDark ? '☀ Light Mode' : '🌙 Dark Mode' }}
    </button>
  `
})
export class DarkToggleComponent implements OnInit {
  // Track current theme state
  isDark = false;

  // Check initial theme preference on component load
  ngOnInit(): void {
    this.isDark = document.documentElement.classList.contains('dark');
  }

  // Toggle dark mode on/off and save preference to localStorage
  toggleDarkMode(): void {
    this.isDark = !this.isDark;
    document.documentElement.classList.toggle('dark', this.isDark);
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
  }
}
