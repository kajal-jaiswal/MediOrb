import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { KioskHeaderComponent } from './components/kiosk-header/kiosk-header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, KioskHeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  // True when on the /doctor full-width dashboard
  private readonly url$ = this.router.events.pipe(
    filter(e => e instanceof NavigationEnd),
    map(e => (e as NavigationEnd).urlAfterRedirects),
  );

  readonly isDoctorPage = toSignal(
    this.url$.pipe(map(url => url.startsWith('/doctor'))),
    { initialValue: this.router.url.startsWith('/doctor') }
  );

  constructor(private router: Router) {}
}
