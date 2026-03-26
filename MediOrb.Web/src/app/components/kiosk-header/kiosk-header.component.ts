import { Component, OnInit, OnDestroy, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ThemeService, THEME_OPTIONS } from '../../services/theme.service';

@Component({
  selector: 'app-kiosk-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="kiosk-header">
      <div class="brand">
        <div class="logo-mark">M</div>
        <div class="brand-text">
          <span class="brand-name">MediOrb</span>
          <span class="brand-sub">AI Hospital Kiosk</span>
        </div>
      </div>

      <div class="header-right">
        <div class="status-dot"></div>
        <span class="status-text">Online</span>
        <span class="clock">{{ clockStr }}</span>

        <a routerLink="/doctor" class="hdr-btn doc-btn" title="Doctor Dashboard">
          &#128084; Doctor
        </a>

        <!-- Theme switcher — click-based, closes on outside click -->
        <div class="theme-wrap" (click)="$event.stopPropagation()">
          <button class="hdr-btn theme-btn"
                  [class.theme-btn-open]="menuOpen()"
                  (click)="menuOpen.set(!menuOpen())"
                  title="Switch theme">
            <span class="theme-icon">{{ themeService.currentOption.icon }}</span>
            <span class="theme-label">Theme</span>
            <span class="theme-caret" [class.caret-open]="menuOpen()">▾</span>
          </button>

          <div class="theme-menu" [class.theme-menu-open]="menuOpen()">
            <div class="menu-header">Choose Theme</div>
            <button *ngFor="let t of themes"
                    class="theme-opt"
                    [class.theme-opt-active]="t.id === themeService.current()"
                    (click)="pickTheme(t.id)">
              <span class="theme-opt-icon">{{ t.icon }}</span>
              <span class="theme-opt-label">{{ t.label }}</span>
              <span *ngIf="t.id === themeService.current()" class="theme-check">✓</span>
            </button>
          </div>
        </div>

        <span class="poc-badge">POC v2.0</span>
      </div>
    </header>
  `,
  styles: [`
    .kiosk-header {
      position: fixed; top: 0; left: 0; right: 0; z-index: 50;
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 24px;
      background: var(--header-bg);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--header-border);
    }

    /* ── Brand ───────────────────────────── */
    .brand      { display: flex; align-items: center; gap: 10px; }
    .logo-mark  {
      width: 30px; height: 30px; border-radius: 8px;
      background: var(--gradient);
      display: flex; align-items: center; justify-content: center;
      font-weight: 900; font-size: 14px; color: white;
      flex-shrink: 0;
    }
    .brand-text  { display: flex; flex-direction: column; line-height: 1; }
    .brand-name  { font-weight: 700; font-size: 14px; color: var(--text-primary); }
    .brand-sub   { font-size: 10px; color: var(--text-muted); margin-top: 2px; }

    /* ── Header right ────────────────────── */
    .header-right { display: flex; align-items: center; gap: 8px; }
    .status-dot   { width: 6px; height: 6px; border-radius: 50%; background: var(--success); flex-shrink: 0; }
    .status-text  { font-size: 11px; color: var(--success); font-weight: 600; }
    .clock        { font-size: 11px; color: var(--text-muted); font-family: monospace; }

    /* ── Shared button style ─────────────── */
    .hdr-btn {
      font-size: 11px; font-weight: 600; color: var(--text-muted);
      padding: 5px 11px; border-radius: 8px; cursor: pointer;
      background: var(--surface-1); border: 1px solid var(--border-subtle);
      text-decoration: none; display: inline-flex; align-items: center; gap: 5px;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
      font-family: inherit; white-space: nowrap;
    }
    .hdr-btn:hover { background: var(--surface-2); color: var(--text-primary); border-color: var(--border); }
    .doc-btn { color: var(--accent); border-color: var(--border); }

    /* ── Theme switcher ──────────────────── */
    .theme-wrap  { position: relative; }
    .theme-btn   { color: var(--accent); border-color: var(--border); gap: 5px; }
    .theme-btn-open {
      background: var(--surface-2) !important;
      border-color: var(--border-hover) !important;
      color: var(--text-primary) !important;
    }
    .theme-icon  { font-size: 13px; line-height: 1; }
    .theme-label { font-size: 11px; }
    .theme-caret { font-size: 10px; transition: transform 0.2s ease; display: inline-block; }
    .caret-open  { transform: rotate(180deg); }

    /* Dropdown panel */
    .theme-menu {
      display: none;
      position: absolute; top: calc(100% + 8px); right: 0;
      background: var(--header-bg);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 8px;
      min-width: 178px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08);
      z-index: 200;
      animation: menu-in 0.15s ease;
    }
    @keyframes menu-in {
      from { opacity: 0; transform: translateY(-6px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0)    scale(1); }
    }
    .theme-menu-open { display: flex; flex-direction: column; gap: 2px; }

    .menu-header {
      font-size: 9px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: var(--text-faint);
      padding: 4px 10px 6px; user-select: none;
    }

    .theme-opt {
      display: flex; align-items: center; gap: 9px;
      padding: 8px 10px; border-radius: 9px;
      font-size: 12px; font-weight: 600;
      color: var(--text-muted); background: none;
      border: none; cursor: pointer; font-family: inherit;
      transition: background 0.12s, color 0.12s;
      white-space: nowrap; width: 100%; text-align: left;
    }
    .theme-opt:hover { background: var(--surface-2); color: var(--text-primary); }
    .theme-opt-active { background: var(--surface-2); color: var(--accent); }
    .theme-opt-icon { font-size: 15px; width: 20px; text-align: center; flex-shrink: 0; }
    .theme-opt-label { flex: 1; }
    .theme-check { font-size: 11px; font-weight: 700; color: var(--accent); flex-shrink: 0; }

    /* ── Badge ───────────────────────────── */
    .poc-badge {
      font-size: 10px; font-weight: 700; color: var(--accent);
      padding: 3px 9px; border-radius: 6px;
      background: var(--surface-2); border: 1px solid var(--border);
    }

    /* ── Responsive ─────────────────────── */
    @media (max-width: 640px) {
      .kiosk-header { padding: 10px 14px; }
      .status-text, .clock, .poc-badge { display: none; }
      .theme-label { display: none; }
    }
  `],
})
export class KioskHeaderComponent implements OnInit, OnDestroy {
  clockStr = '';
  readonly menuOpen = signal(false);
  readonly themes   = THEME_OPTIONS;

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(readonly themeService: ThemeService) {}

  ngOnInit(): void {
    this.updateClock();
    this.timer = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  /** Close menu when clicking anywhere outside the theme-wrap */
  @HostListener('document:click')
  onDocumentClick(): void {
    this.menuOpen.set(false);
  }

  pickTheme(id: import('../../services/theme.service').Theme): void {
    this.themeService.set(id);
    this.menuOpen.set(false);
  }

  private updateClock(): void {
    const d = new Date();
    this.clockStr =
      d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) +
      ' · ' +
      d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
}
