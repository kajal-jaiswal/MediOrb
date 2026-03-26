import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { KioskStateService } from '../../services/kiosk-state.service';
import { StepIndicatorComponent } from '../../components/step-indicator/step-indicator.component';
import { translations } from '../../translations';

function phoneValidator(control: AbstractControl) {
  const val = control.value ?? '';
  return /^[6-9]\d{9}$/.test(val) ? null : { phone: true };
}

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, StepIndicatorComponent],
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css'],
})
export class RegistrationComponent {
  readonly t = computed(() => translations[this.state.language()].registration);
  readonly stepLabels = computed(() => {
    const triage = translations[this.state.language()].triage;
    return ['Register', 'Symptoms', 'Triage', 'Confirm'];
  });

  form = this.fb.group({
    name:    ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(/^[a-zA-Z\s.'\-]+$/)]],
    age:     [null as number | null, [Validators.required, Validators.min(1), Validators.max(120)]],
    gender:  ['male', Validators.required],
    contact: ['', [Validators.required, phoneValidator]],
    email:   ['', Validators.email],
    consent: [false, Validators.requiredTrue],
  });

  submitted = false;

  constructor(
    readonly state: KioskStateService,
    private router: Router,
    private fb: FormBuilder,
  ) {}

  get f() { return this.form.controls; }

  fieldError(field: 'name' | 'age' | 'gender' | 'contact' | 'email' | 'consent'): string {
    if (!this.submitted || !this.f[field].errors) return '';
    const e = this.f[field].errors!;
    if (field === 'name') {
      if (e['required'])   return 'Full name is required.';
      if (e['minlength'])  return 'Name must be at least 2 characters.';
      if (e['pattern'])    return 'Name can only contain letters and spaces.';
    }
    if (field === 'age') {
      if (e['required'])   return 'Age is required.';
      if (e['min'] || e['max']) return 'Please enter a valid age (1–120).';
    }
    if (field === 'contact') {
      if (e['required'])   return 'Phone number is required.';
      if (e['phone'])      return 'Enter a valid 10-digit mobile number starting with 6–9.';
    }
    if (field === 'email' && e['email']) return 'Enter a valid email address.';
    if (field === 'consent' && e['required']) return 'You must consent to proceed.';
    return '';
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/\D/g, '').slice(0, 10);
    input.value = cleaned;
    this.f.contact.setValue(cleaned);
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    const val = this.form.value;
    this.state.setPatient({
      name:    val.name!.trim(),
      age:     val.age!,
      gender:  val.gender as 'male' | 'female' | 'other',
      contact: val.contact!,
      email:   val.email ?? '',
    });
    this.router.navigate(['/symptoms']);
  }
}
