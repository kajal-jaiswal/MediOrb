import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { KioskStateService } from '../../services/kiosk-state.service';
import { AiOrbComponent } from '../../components/ai-orb/ai-orb.component';
import { StepIndicatorComponent } from '../../components/step-indicator/step-indicator.component';
import { translations } from '../../translations';

type UrgencyKey = 'Low' | 'Medium' | 'High' | 'Emergency';

interface UrgencyStyle {
  badge: string; dot: string; textColor: string; label: string;
}

interface StructuredReasoning {
  summary: string;
  bullets: string[];
  action: string;
}

@Component({
  selector: 'app-triage',
  standalone: true,
  imports: [CommonModule, AiOrbComponent, StepIndicatorComponent],
  templateUrl: './triage.component.html',
  styleUrls: ['./triage.component.css'],
})
export class TriageComponent implements OnInit {
  readonly t          = computed(() => translations[this.state.language()].triage);
  readonly result     = computed(() => this.state.triageResult());
  readonly isAnalyzing = computed(() => !this.state.triageResult());

  readonly urgencyStyles: Record<UrgencyKey, UrgencyStyle> = {
    Low:       { badge: 'badge-low',       dot: '#10B981', textColor: '#10B981', label: 'Low Priority'   },
    Medium:    { badge: 'badge-medium',    dot: '#F59E0B', textColor: '#F59E0B', label: 'Medium Priority' },
    High:      { badge: 'badge-high',      dot: '#F97316', textColor: '#F97316', label: 'High Priority'   },
    Emergency: { badge: 'badge-emergency', dot: '#EF4444', textColor: '#EF4444', label: 'Emergency'       },
  };

  // ── Structured AI reasoning (Phase A) ────────────────────────
  readonly structuredReasoning = computed((): StructuredReasoning | null => {
    const r = this.state.triageResult();
    if (!r) return null;

    const raw = r.reasoning.trim();
    // Split on sentence boundaries, filter noise
    const sentences = raw.match(/[^.!?]+[.!?]+/g) ?? [raw];
    const summary   = sentences[0]?.trim() ?? raw;
    const bullets   = sentences.slice(1).map(s => s.trim()).filter(s => s.length > 8);

    const actions: Record<string, string> = {
      Emergency: 'Proceed immediately to the Emergency bay — do not wait in line.',
      High:      'Go directly to the department — a nurse will assist you shortly.',
      Medium:    'Please take a seat in the waiting area — you will be called soon.',
      Low:       'Register at the front desk and wait comfortably to be called.',
    };

    return {
      summary,
      bullets,
      action: actions[r.urgencyLevel] ?? actions['Medium'],
    };
  });

  constructor(readonly state: KioskStateService, private router: Router) {}

  ngOnInit(): void {
    if (!this.state.patient()) this.router.navigate(['/welcome']);
  }

  getUrgencyStyle(level: string): UrgencyStyle {
    return this.urgencyStyles[level as UrgencyKey] ?? this.urgencyStyles['Medium'];
  }

  // ── Doctor avatar initials (Phase A) ─────────────────────────
  getInitials(name: string): string {
    return name
      .replace(/^Dr\.\s*/i, '')
      .split(' ')
      .slice(0, 2)
      .map(n => n[0] ?? '')
      .join('')
      .toUpperCase();
  }

  confirm(): void { this.router.navigate(['/confirmation']); }
}
