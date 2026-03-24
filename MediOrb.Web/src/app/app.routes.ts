import { Routes } from '@angular/router';
import { patientGuard, triageGuard } from './guards/patient.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/welcome', pathMatch: 'full' },
  {
    path: 'welcome',
    loadComponent: () =>
      import('./pages/welcome/welcome.component').then(m => m.WelcomeComponent),
  },
  {
    path: 'returning',
    loadComponent: () =>
      import('./pages/existing-patient/existing-patient.component').then(m => m.ExistingPatientComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/registration/registration.component').then(m => m.RegistrationComponent),
  },
  {
    path: 'symptoms',
    canActivate: [patientGuard],
    loadComponent: () =>
      import('./pages/symptoms/symptoms.component').then(m => m.SymptomsComponent),
  },
  {
    path: 'triage',
    canActivate: [patientGuard],
    loadComponent: () =>
      import('./pages/triage/triage.component').then(m => m.TriageComponent),
  },
  {
    path: 'confirmation',
    canActivate: [triageGuard],
    loadComponent: () =>
      import('./pages/confirmation/confirmation.component').then(m => m.ConfirmationComponent),
  },
  {
    path: 'doctor',
    loadComponent: () =>
      import('./pages/doctor/doctor.component').then(m => m.DoctorComponent),
  },
  { path: '**', redirectTo: '/welcome' },
];
