import { Component, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { KioskStateService } from '../../services/kiosk-state.service';
import { TriageService } from '../../services/triage.service';
import { SpeechService } from '../../services/speech.service';
import { AiOrbComponent, OrbState } from '../../components/ai-orb/ai-orb.component';
import { StepIndicatorComponent } from '../../components/step-indicator/step-indicator.component';
import { translations, Language } from '../../translations';

const LANG_CODES: Record<Language, string> = {
  English: 'en-US', Hindi: 'hi-IN', Spanish: 'es-ES',
};

@Component({
  selector: 'app-symptoms',
  standalone: true,
  imports: [CommonModule, FormsModule, AiOrbComponent, StepIndicatorComponent],
  templateUrl: './symptoms.component.html',
  styleUrls: ['./symptoms.component.css'],
})
export class SymptomsComponent implements OnInit, OnDestroy {
  readonly t = computed(() => translations[this.state.language()].symptoms);

  symptomsText = '';
  isAnalyzing  = false;
  inputError   = '';
  triageError  = '';
  isSubmitting = false;

  isListening  = false;
  speechError: string | null = null;

  private subs = new Subscription();

  get orbState(): OrbState {
    if (this.isAnalyzing) return 'processing';
    if (this.isListening)  return 'listening';
    return 'idle';
  }

  get firstName(): string {
    const p = this.state.patient();
    return p ? p.name.split(' ')[0] : '';
  }

  get greeting(): string {
    return this.t().greeting.replace('{name}', this.firstName);
  }

  constructor(
    readonly state: KioskStateService,
    readonly speech: SpeechService,
    private triage: TriageService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (!this.state.patient()) { this.router.navigate(['/welcome']); return; }

    const lang = this.state.language();
    this.speech.setLanguage(LANG_CODES[lang] ?? 'en-US');

    // TTS greeting
    setTimeout(() => this.speech.speak(this.greeting, LANG_CODES[lang]), 600);

    this.subs.add(this.speech.isListening$.subscribe(v => this.isListening = v));
    this.subs.add(this.speech.transcript$.subscribe(t => { if (t) this.symptomsText = t; }));
    this.subs.add(this.speech.error$.subscribe(e => this.speechError = e));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.speech.stopListening();
    window.speechSynthesis?.cancel();
  }

  toggleVoice(): void {
    if (this.isListening) {
      this.speech.stopListening();
    } else {
      this.speech.resetTranscript();
      this.symptomsText = '';
      this.inputError = '';
      this.speech.startListening();
    }
  }

  clearInput(): void {
    this.speech.stopListening();
    this.speech.resetTranscript();
    this.symptomsText = '';
    this.inputError = '';
    this.triageError = '';
  }

  addChip(tag: string): void {
    this.symptomsText = this.symptomsText.trim()
      ? `${this.symptomsText.trim()}, ${tag.toLowerCase()}`
      : tag;
    this.inputError = '';
  }

  analyze(): void {
    if (this.isSubmitting || this.isAnalyzing) return;
    const text = this.symptomsText.trim();
    if (text.length < 10) {
      this.inputError = 'Please describe your symptoms in at least 10 characters.';
      return;
    }

    this.inputError   = '';
    this.triageError  = '';
    this.isSubmitting = true;
    this.isAnalyzing  = true;
    this.speech.stopListening();

    const patient = this.state.patient()!;
    this.state.setSymptoms(text);

    this.triage.analyzeSymptoms({
      patientId:        this.state.patientId(),
      appointmentId:    this.state.appointmentId(),
      patientName:      patient.name,
      contact:          patient.contact,
      email:            patient.email || undefined,
      isReturning:      this.state.isReturning(),
      previousSymptoms: this.state.previousSymptoms() || undefined,
      symptoms:         text,
      age:              patient.age,
      gender:           patient.gender,
      language:         this.state.language(),
    }).subscribe({
      next: result => {
        this.state.setTriageResult(result);
        this.isAnalyzing  = false;
        this.isSubmitting = false;
        this.router.navigate(['/triage']);
      },
      error: () => {
        this.isAnalyzing  = false;
        this.isSubmitting = false;
        this.triageError = 'AI analysis failed. Please check your connection and try again.';
      },
    });
  }
}
