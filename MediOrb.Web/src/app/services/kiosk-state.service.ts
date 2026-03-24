import { Injectable, signal } from '@angular/core';
import { PatientModel } from '../models/patient.model';
import { TriageResult } from '../models/triage.model';
import { Language } from '../translations';

export type KioskStep = 'welcome' | 'register' | 'symptoms' | 'triage' | 'confirmation';

function generateId(prefix: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 9; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${id}`;
}

@Injectable({ providedIn: 'root' })
export class KioskStateService {
  readonly language      = signal<Language>('English');
  readonly patient       = signal<PatientModel | null>(null);
  readonly triageResult  = signal<TriageResult | null>(null);
  readonly symptoms      = signal<string>('');
  readonly patientId     = signal<string>(generateId('PAT'));
  readonly appointmentId = signal<string>(generateId('APP'));
  readonly step          = signal<KioskStep>('welcome');

  // Returning patient state
  readonly isReturning      = signal<boolean>(false);
  readonly previousSymptoms = signal<string>('');

  setLanguage(lang: Language): void      { this.language.set(lang); }
  setPatient(p: PatientModel): void      { this.patient.set(p); }
  setSymptoms(s: string): void           { this.symptoms.set(s); }
  setTriageResult(r: TriageResult): void { this.triageResult.set(r); }
  setStep(s: KioskStep): void            { this.step.set(s); }

  setReturning(returning: boolean, prevSymptoms = ''): void {
    this.isReturning.set(returning);
    this.previousSymptoms.set(prevSymptoms);
  }

  resetKiosk(): void {
    this.patient.set(null);
    this.triageResult.set(null);
    this.symptoms.set('');
    this.step.set('welcome');
    this.isReturning.set(false);
    this.previousSymptoms.set('');
    this.patientId.set(generateId('PAT'));
    this.appointmentId.set(generateId('APP'));
  }
}
