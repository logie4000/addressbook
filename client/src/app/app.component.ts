import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { APP_TITLE } from './app.config';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = APP_TITLE;
  auth = inject(AuthService);
}
