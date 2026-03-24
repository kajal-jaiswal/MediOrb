import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { PatientAlert } from '../models/patient-queue.model';

@Injectable({ providedIn: 'root' })
export class SignalrService {
  private hub: signalR.HubConnection | null = null;

  readonly isConnected$ = new Subject<boolean>();
  readonly newPatient$ = new Subject<PatientAlert>();
  readonly statusUpdated$ = new Subject<{
    appointmentId: string;
    status: string;
    patientName: string;
  }>();

  get isConnected(): boolean {
    return this.hub?.state === signalR.HubConnectionState.Connected;
  }

  connect(): void {
    if (this.hub?.state === signalR.HubConnectionState.Connected) return;

    this.hub = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5001/hubs/patients')
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.hub.on('NewPatientAlert', (alert: PatientAlert) => {
      this.newPatient$.next(alert);
    });

    this.hub.on('PatientStatusUpdated', (update: { appointmentId: string; status: string; patientName: string }) => {
      this.statusUpdated$.next(update);
    });

    this.hub.onreconnected(() => {
      this.hub!.invoke('JoinDoctorRoom').catch(console.error);
      this.isConnected$.next(true);
    });

    this.hub.onclose(() => this.isConnected$.next(false));

    this.hub
      .start()
      .then(() => {
        this.hub!.invoke('JoinDoctorRoom').catch(console.error);
        this.isConnected$.next(true);
      })
      .catch(err => {
        console.error('SignalR connection failed:', err);
        this.isConnected$.next(false);
      });
  }

  disconnect(): void {
    this.hub?.stop().catch(console.error);
    this.hub = null;
  }
}
