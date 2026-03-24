import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KioskStateService } from '../services/kiosk-state.service';

export const patientGuard: CanActivateFn = () => {
  const state  = inject(KioskStateService);
  const router = inject(Router);

  if (!state.patient()) {
    router.navigate(['/welcome']);
    return false;
  }
  return true;
};

export const triageGuard: CanActivateFn = () => {
  const state  = inject(KioskStateService);
  const router = inject(Router);

  if (!state.triageResult()) {
    router.navigate(['/welcome']);
    return false;
  }
  return true;
};
