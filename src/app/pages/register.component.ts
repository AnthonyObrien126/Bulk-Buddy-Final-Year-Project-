import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  email = '';
  password = '';
  confirmPassword = '';
  message = '';
  error = '';
  

  constructor(private auth: AuthService, private router: Router) {}

  onRegister() {
    if (this.password !== this.confirmPassword) {
      this.error = "Passwords don't match";
      return;
    }

    this.auth.register(this.email, this.password).subscribe({
      next: () => {
        this.message = 'Registered successfully. You can now log in.';
        this.error = '';
        setTimeout(() => this.router.navigate(['/login']), 1000);
      },
      error: err => {
        this.error = err.error?.error || 'Registration failed';
      }
    });
  }
}
