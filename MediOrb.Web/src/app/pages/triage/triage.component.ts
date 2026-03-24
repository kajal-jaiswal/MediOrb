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

@Component({
  selector: 'app-triage',
  standalone: true,
  imports: [CommonModule, AiOrbComponent, StepIndicatorComponent],
  templateUrl: './triage.component.html',
  styleUrls: ['./triage.component.css'],
})
export class TriageComponent implements OnInit {
  readonly t = computed(() => translations[this.state.language()].triage);
  readonly result = computed(() => this.state.triageResult());
  readonly isAnalyzing = computed(() => !this.state.triageResult());

  readonly urgencyStyles: Record<UrgencyKey, UrgencyStyle> = {
    Low:       { badge: 'badge-low',       dot: '#10B981', textColor: '#10B981', label: 'Low Priority'   },
    Medium:    { badge: 'badge-medium',    dot: '#F59E0B', textColor: '#F59E0B', label: 'Medium Priority' },
    High:      { badge: 'badge-high',      dot: '#F97316', textColor: '#F97316', label: 'High Priority'   },
    Emergency: { badge: 'badge-emergency', dot: '#EF4444', textColor: '#EF4444', label: 'Emergency'       },
  };

  constructor(readonly state: KioskStateService, private router: Router) {}

  ngOnInit(): void {
    if (!this.state.patient()) this.router.navigate(['/welcome']);
  }

  getUrgencyStyle(level: string): UrgencyStyle {
    return this.urgencyStyles[level as UrgencyKey] ?? this.urgencyStyles['Medium'];
  }

  confirm(): void { this.router.navigate(['/confirmation']); }
}
