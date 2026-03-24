import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { KioskStateService } from '../../services/kiosk-state.service';
import { AiOrbComponent } from '../../components/ai-orb/ai-orb.component';
import { translations, Language } from '../../translations';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, AiOrbComponent],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css'],
})
export class WelcomeComponent {
  readonly langs: Language[] = ['English', 'Hindi', 'Spanish'];
  readonly langLabels: Record<Language, string> = { English: 'EN', Hindi: 'हि', Spanish: 'ES' };

  readonly t = computed(() => translations[this.state.language()].welcome);
  readonly currentLang = computed(() => this.state.language());

  constructor(readonly state: KioskStateService, private router: Router) {}

  setLang(l: Language): void { this.state.setLanguage(l); }
  start(): void { this.router.navigate(['/register']); }
  returning(): void { this.router.navigate(['/returning']); }
}
