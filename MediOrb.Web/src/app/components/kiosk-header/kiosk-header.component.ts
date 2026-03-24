import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

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

        <button class="hdr-btn hcm-btn"
                [class.hcm-active]="hcm"
                (click)="toggleHCM()"
                title="Toggle High Contrast Mode (Accessibility)">
          &#9788; HC
        </button>

        <span class="poc-badge">POC v2.0</span>
      </div>
    </header>
  `,
  styles: [`
    .kiosk-header {
      position:fixed; top:0; left:0; right:0; z-index:50;
      display:flex; align-items:center; justify-content:space-between;
      padding:12px 24px;
      background:rgba(10,15,28,0.75);
      backdrop-filter:blur(20px);
      border-bottom:1px solid rgba(255,255,255,0.06);
    }
    .brand { display:flex; align-items:center; gap:10px; }
    .logo-mark {
      width:28px; height:28px; border-radius:8px;
      background:linear-gradient(135deg,#6366F1,#8B5CF6);
      display:flex; align-items:center; justify-content:center;
      font-weight:900; font-size:13px; color:white;
    }
    .brand-text { display:flex; flex-direction:column; line-height:1; }
    .brand-name { font-weight:700; font-size:14px; color:white; }
    .brand-sub  { font-size:10px; color:#A1A1AA; margin-top:2px; }
    .header-right { display:flex; align-items:center; gap:8px; }
    .status-dot { width:6px; height:6px; border-radius:50%; background:#10B981; }
    .status-text { font-size:11px; color:#10B981; font-weight:600; }
    .clock { font-size:11px; color:#A1A1AA; font-family:monospace; }
    .hdr-btn {
      font-size:11px; font-weight:600; color:#A1A1AA;
      padding:4px 10px; border-radius:8px; cursor:pointer;
      background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08);
      text-decoration:none; display:inline-flex; align-items:center; gap:4px;
      transition:all 0.15s; font-family:inherit;
    }
    .hdr-btn:hover { background:rgba(255,255,255,0.09); color:white; }
    .doc-btn { color:#818CF8; border-color:rgba(99,102,241,0.25); }
    .hcm-btn { color:#A1A1AA; }
    .hcm-active { background:rgba(255,255,255,0.14) !important; color:white !important; border-color:rgba(255,255,255,0.3) !important; }
    .poc-badge {
      font-size:10px; font-weight:700; color:#818CF8;
      padding:3px 8px; border-radius:6px;
      background:rgba(99,102,241,0.15); border:1px solid rgba(99,102,241,0.25);
    }
  `],
})
export class KioskHeaderComponent implements OnInit, OnDestroy {
  clockStr = '';
  hcm      = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.updateClock();
    this.timer = setInterval(() => this.updateClock(), 1000);
    // Restore persisted preference
    this.hcm = localStorage.getItem('mediOrb_hcm') === '1';
    document.body.classList.toggle('hc', this.hcm);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  toggleHCM(): void {
    this.hcm = !this.hcm;
    document.body.classList.toggle('hc', this.hcm);
    localStorage.setItem('mediOrb_hcm', this.hcm ? '1' : '0');
  }

  private updateClock(): void {
    const d = new Date();
    this.clockStr =
      d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) +
      ' · ' +
      d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
}
