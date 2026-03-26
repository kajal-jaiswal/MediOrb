import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Subject } from 'rxjs';
import { PatientAlert } from '../models/patient-queue.model';
import { environment } from '../../environments/environment';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected';

@Injectable({ providedIn: 'root' })
export class SignalrService {
  private hub: signalR.HubConnection | null = null;

  // Sourced from environment — Vercel cannot proxy WebSocket traffic,
  // so this always points directly at the backend (Render in production).
  private readonly hubUrl = environment.signalrUrl;

  readonly isConnected$ = new BehaviorSubject<boolean>(false);
  readonly connectionState$ = new BehaviorSubject<ConnectionState>('connecting');
  readonly newPatient$ = new Subject<PatientAlert>();
  readonly statusUpdated$ = new Subject<{
    appointmentId: string;
    status: string;
    patientName: string;
  }>();
  readonly patientCalled$ = new Subject<{
    patientName: string;
    doctorName: string;
    room: string;
  }>();

  get isConnected(): boolean {
    return this.hub?.state === signalR.HubConnectionState.Connected;
  }

  connect(): void {
    if (this.hub?.state === signalR.HubConnectionState.Connected) return;

    this.connectionState$.next('connecting');

    this.hub = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        transport: signalR.HttpTransportType.WebSockets,
        skipNegotiation: true,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.hub.on('NewPatientAlert', (alert: PatientAlert) => {
      this.newPatient$.next(alert);
    });

    this.hub.on('PatientStatusUpdated', (update: { appointmentId: string; status: string; patientName: string }) => {
      this.statusUpdated$.next(update);
    });

    this.hub.on('PatientCalled', (info: { patientName: string; doctorName: string; room: string }) => {
      this.patientCalled$.next(info);
    });

    this.hub.onreconnecting(() => {
      this.isConnected$.next(false);
      this.connectionState$.next('connecting');
    });

    this.hub.onreconnected(() => {
      this.hub!.invoke('JoinDoctorRoom').catch(console.error);
      this.isConnected$.next(true);
      this.connectionState$.next('connected');
    });

    this.hub.onclose(() => {
      this.isConnected$.next(false);
      this.connectionState$.next('disconnected');
    });

    this.hub
      .start()
      .then(() => {
        this.hub!.invoke('JoinDoctorRoom').catch(console.error);
        this.isConnected$.next(true);
        this.connectionState$.next('connected');
      })
      .catch(err => {
        console.error('SignalR connection failed:', err);
        this.isConnected$.next(false);
        this.connectionState$.next('disconnected');
      });
  }

  disconnect(): void {
    this.hub?.stop().catch(console.error);
    this.hub = null;
    this.isConnected$.next(false);
    this.connectionState$.next('disconnected');
  }
}
