import { Injectable, signal } from '@angular/core';

export type Theme = 'green' | 'blue' | 'yellow' | 'violet' | 'mustard';

export interface ThemeOption {
  id: Theme;
  label: string;
  icon: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'green',   label: 'Medical Green',   icon: '🌿' },
  { id: 'blue',    label: 'Medical Blue',     icon: '🔵' },
  { id: 'yellow',  label: 'Warm Yellow',      icon: '🟡' },
  { id: 'violet',  label: 'Violet Premium',   icon: '🟣' },
  { id: 'mustard', label: 'Mustard Dark',     icon: '⚫' },
];

const STORAGE_KEY = 'mediOrb_theme';
const ALL_CLASSES  = THEME_OPTIONS.map(t => `theme-${t.id}`);

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly current = signal<Theme>('green');

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    this.apply(this.isValid(saved) ? saved! : 'green');
  }

  set(theme: Theme): void {
    this.apply(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  get currentOption(): ThemeOption {
    return THEME_OPTIONS.find(t => t.id === this.current()) ?? THEME_OPTIONS[0];
  }

  private apply(theme: Theme): void {
    const body = document.body;
    ALL_CLASSES.forEach(c => body.classList.remove(c));
    body.classList.add(`theme-${theme}`);
    this.current.set(theme);
  }

  private isValid(v: string | null): v is Theme {
    return !!v && THEME_OPTIONS.some(t => t.id === v);
  }
}
