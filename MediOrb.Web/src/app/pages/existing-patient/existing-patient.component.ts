import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { KioskStateService } from '../../services/kiosk-state.service';
import { TriageService } from '../../services/triage.service';
import { LookupResult } from '../../models/patient-queue.model';
import { PatientModel } from '../../models/patient.model';

type LookupState = 'idle' | 'searching' | 'found' | 'not-found' | 'error';

@Component({
  selector: 'app-existing-patient',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './existing-patient.component.html',
  styleUrls: ['./existing-patient.component.css'],
})
export class ExistingPatientComponent {
  query = '';
  lookupState = signal<LookupState>('idle');
  foundPatient = signal<LookupResult | null>(null);
  errorMsg = '';

  constructor(
    private state: KioskStateService,
    private triage: TriageService,
    private router: Router,
  ) {}

  get canSearch(): boolean {
    return this.query.trim().length >= 3 && this.lookupState() !== 'searching';
  }

  search(): void {
    const q = this.query.trim();
    if (!q || q.length < 3) return;

    this.lookupState.set('searching');
    this.foundPatient.set(null);
    this.errorMsg = '';

    this.triage.lookupPatient(q).subscribe({
      next: result => {
        this.foundPatient.set(result);
        this.lookupState.set('found');
      },
      error: err => {
        if (err.status === 404) {
          this.lookupState.set('not-found');
        } else {
          this.lookupState.set('error');
          this.errorMsg = 'Could not connect to server. Please try again.';
        }
      },
    });
  }

  proceed(): void {
    const p = this.foundPatient();
    if (!p) return;

    // Pre-fill kiosk state with returned patient data
    const patient: PatientModel = {
      name:    p.name,
      age:     p.age,
      gender:  p.gender as 'male' | 'female' | 'other',
      contact: p.contact,
      email:   p.email ?? '',
    };

    this.state.setPatient(patient);
    this.state.setReturning(true, p.previousSymptoms ?? '');
    // Keep existing patientId from lookup (so doctor sees the same patient)
    this.state.patientId.set(p.patientId);

    this.router.navigate(['/symptoms']);
  }

  registerNew(): void {
    this.router.navigate(['/register']);
  }

  back(): void {
    this.router.navigate(['/welcome']);
  }

  onEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.canSearch) this.search();
  }
}
