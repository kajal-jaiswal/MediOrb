import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { KioskStateService } from '../../services/kiosk-state.service';
import { TriageService } from '../../services/triage.service';
import { StepIndicatorComponent } from '../../components/step-indicator/step-indicator.component';
import { translations } from '../../translations';

type NotifyStatus = 'idle' | 'sending' | 'sent' | 'error';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [CommonModule, StepIndicatorComponent],
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.css'],
})
export class ConfirmationComponent implements OnInit {
  readonly t = computed(() => translations[this.state.language()].confirmation);
  readonly result = computed(() => this.state.triageResult());

  smsStatus = signal<NotifyStatus>('idle');
  emailStatus = signal<NotifyStatus>('idle');

  readonly appointmentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  readonly appointmentTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  });

  constructor(
    readonly state: KioskStateService,
    private triage: TriageService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (!this.state.triageResult()) this.router.navigate(['/welcome']);
  }

  getUrgencyColor(level: string): string {
    const map: Record<string, string> = {
      Low: '#10B981', Medium: '#F59E0B', High: '#F97316', Emergency: '#EF4444',
    };
    return map[level] ?? '#F59E0B';
  }

  async sendSms(): Promise<void> {
    if (this.smsStatus() !== 'idle') return;
    this.smsStatus.set('sending');
    try {
      const p = this.state.patient();
      const r = this.result();
      if (!p || !r) throw new Error('Missing data');

      const message =
        `MediOrb: Hi ${p.name}, your appointment ` +
        `(${this.state.appointmentId()}) is confirmed with ${r.recommendedDoctor.name}. ` +
        `Est. wait: ${r.estimatedWaitTime}. ` +
        `Proceed to ${r.recommendedDoctor.floor}, ${r.recommendedDoctor.room}.`;

      const res = await firstValueFrom(this.triage.sendSms(p.contact, message));
      // res.success will be true even in mock mode so the demo always shows "Sent!"
      // When Twilio is configured, it reflects real delivery status.
      this.smsStatus.set(res?.success !== false ? 'sent' : 'error');
    } catch {
      this.smsStatus.set('error');
    }
  }

  async sendEmail(): Promise<void> {
    if (this.emailStatus() !== 'idle') return;
    const p = this.state.patient();
    if (!p?.email) { this.emailStatus.set('error'); return; }
    this.emailStatus.set('sending');
    try {
      const r = this.result();
      if (!r) throw new Error('Missing data');
      const res = await firstValueFrom(this.triage.sendEmail({
        email:         p.email,
        patientName:   p.name,
        patientId:     this.state.patientId(),
        appointmentId: this.state.appointmentId(),
        doctorName:    r.recommendedDoctor.name,
        specialty:     r.recommendedDoctor.specialty,
        floor:         r.recommendedDoctor.floor,
        room:          r.recommendedDoctor.room,
        urgency:       r.urgencyLevel,
        reasoning:     r.reasoning,
        symptoms:      this.state.symptoms(),
      }));
      this.emailStatus.set(res?.success ? 'sent' : 'error');
    } catch {
      this.emailStatus.set('error');
    }
  }

  downloadReport(): void {
    const p = this.state.patient();
    const r = this.result();
    if (!p || !r) return;

    const lines = [
      '═══════════════════════════════════════',
      '        MediOrb — Patient Report       ',
      '═══════════════════════════════════════',
      '',
      `Patient ID     : ${this.state.patientId()}`,
      `Appointment ID : ${this.state.appointmentId()}`,
      `Date & Time    : ${this.appointmentDate}, ${this.appointmentTime}`,
      '',
      '─── Patient Information ───────────────',
      `Name           : ${p.name}`,
      `Age            : ${p.age}`,
      `Gender         : ${p.gender}`,
      `Contact        : ${p.contact}`,
      p.email ? `Email          : ${p.email}` : '',
      '',
      '─── Triage Results ────────────────────',
      `Urgency Level  : ${r.urgencyLevel}`,
      `Wait Time      : ${r.estimatedWaitTime}`,
      '',
      '─── Recommended Doctor ────────────────',
      `Name           : ${r.recommendedDoctor.name}`,
      `Specialty      : ${r.recommendedDoctor.specialty}`,
      `Location       : ${r.recommendedDoctor.floor} · ${r.recommendedDoctor.room}`,
      `Status         : ${r.recommendedDoctor.available ? 'Available' : 'Busy'}`,
      '',
      '─── AI Reasoning ──────────────────────',
      r.reasoning,
      '',
      ...(r.suggestedTests?.length
        ? [`─── Suggested Tests ───────────────────`, r.suggestedTests.join(', '), '']
        : []),
      ...(r.additionalNotes
        ? [`─── Additional Notes ──────────────────`, r.additionalNotes, '']
        : []),
      '═══════════════════════════════════════',
      '  Generated by MediOrb AI Triage System',
      '═══════════════════════════════════════',
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MediOrb_${this.state.patientId()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  newPatient(): void {
    this.state.resetKiosk();
    this.router.navigate(['/welcome']);
  }
}
