import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-step-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="step-nav" aria-label="Check-in steps">
      <ng-container *ngFor="let label of labels; let i = index">
        <div class="step-node">
          <div class="step-circle"
               [class.done]="i + 1 < currentStep"
               [class.active]="i + 1 === currentStep"
               [attr.aria-current]="i + 1 === currentStep ? 'step' : null">
            <span *ngIf="i + 1 < currentStep" class="check">✓</span>
            <span *ngIf="i + 1 >= currentStep">{{ i + 1 }}</span>
          </div>
          <span class="step-label"
                [class.label-active]="i + 1 === currentStep"
                [class.label-done]="i + 1 < currentStep">{{ label }}</span>
        </div>
        <div *ngIf="i < labels.length - 1"
             class="step-line"
             [class.line-done]="i + 1 < currentStep">
        </div>
      </ng-container>
    </nav>
  `,
  styles: [`
    .step-nav { display:flex; align-items:center; justify-content:center; margin-bottom:24px; }
    .step-node { display:flex; flex-direction:column; align-items:center; gap:6px; }
    .step-circle {
      width:28px; height:28px; border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      font-size:11px; font-weight:700;
      border:2px solid rgba(255,255,255,0.10);
      background:rgba(255,255,255,0.04);
      color:#52525b; transition:all 0.25s ease;
    }
    .step-circle.active  { border-color:rgba(99,102,241,0.7); background:rgba(99,102,241,0.2); color:#818CF8; box-shadow:0 0 12px rgba(99,102,241,0.3); }
    .step-circle.done    { border-color:rgba(16,185,129,0.6); background:rgba(16,185,129,0.15); color:#10B981; }
    .step-label { font-size:10px; font-weight:600; color:#52525b; white-space:nowrap; }
    .label-active { color:#818CF8; }
    .label-done   { color:#10B981; }
    .step-line { flex:1; height:1px; min-width:28px; max-width:48px; margin:0 4px 20px; background:rgba(255,255,255,0.07); border-radius:1px; transition:background 0.4s; }
    .line-done { background:rgba(16,185,129,0.35); }
  `],
})
export class StepIndicatorComponent {
  @Input() currentStep = 1;
  @Input() labels: string[] = ['Register', 'Symptoms', 'Triage', 'Confirm'];
}
