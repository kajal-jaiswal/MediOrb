import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TriageResult } from '../models/triage.model';
import { Language } from '../translations';
import { LookupResult, PatientAlert, QueuePosition } from '../models/patient-queue.model';
import { environment } from '../../environments/environment';

export interface TriageRequest {
  // Patient identity (persisted to DB)
  patientId: string;
  appointmentId: string;
  patientName: string;
  contact: string;
  email?: string;

  // Returning patient context
  isReturning: boolean;
  previousSymptoms?: string;

  // Triage data
  symptoms: string;
  age: number;
  gender: string;
  language: Language;
}

export interface EmailPayload {
  email: string;
  patientName: string;
  patientId: string;
  appointmentId: string;
  doctorName: string;
  specialty: string;
  floor: string;
  room: string;
  urgency: string;
  reasoning: string;
  symptoms: string;
}

@Injectable({ providedIn: 'root' })
export class TriageService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  analyzeSymptoms(req: TriageRequest): Observable<TriageResult> {
    return this.http.post<TriageResult>(`${this.base}/triage`, req);
  }

  lookupPatient(query: string): Observable<LookupResult> {
    return this.http.get<LookupResult>(
      `${this.base}/patients/lookup?query=${encodeURIComponent(query)}`
    );
  }

  getQueue(): Observable<PatientAlert[]> {
    return this.http.get<PatientAlert[]>(`${this.base}/queue`);
  }

  updatePatientStatus(appointmentId: string, status: string): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(
      `${this.base}/queue/${appointmentId}/status`,
      { status }
    );
  }

  getQueuePosition(appointmentId: string): Observable<QueuePosition> {
    return this.http.get<QueuePosition>(`${this.base}/queue/position/${appointmentId}`);
  }

  sendEmail(data: EmailPayload): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.base}/notify/email`, data);
  }

  sendSms(phone: string, message: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.base}/notify/sms`, { phone, message });
  }
}
