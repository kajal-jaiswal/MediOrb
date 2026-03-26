export type PatientStatus = 'Waiting' | 'InProgress' | 'Completed' | 'Transferred';

export interface PatientAlert {
  // ── Existing fields ──────────────────────────────────────────
  appointmentId:     string;
  patientId:         string;
  patientName:       string;
  age:               number;
  gender:            string;
  symptoms:          string;
  urgencyLevel:      string;
  doctorName:        string;
  doctorSpecialty:   string;
  estimatedWaitTime: string;
  reasoning:         string;
  suggestedTests:    string[];
  additionalNotes?:  string;
  status:            PatientStatus;
  checkedInAt:       string; // ISO datetime string

  // ── Phase E additions — optional, backward-compatible ────────
  isReturning?:      boolean;
  previousSymptoms?: string;
  floor?:            string;
  room?:             string;
}

export interface LookupResult {
  patientId:         string;
  name:              string;
  age:               number;
  gender:            string;
  contact:           string;
  email?:            string;
  isReturning:       boolean;
  lastVisit?:        string;
  previousSymptoms?: string;
}

export interface QueuePosition {
  position:     number;
  totalWaiting: number;
}
