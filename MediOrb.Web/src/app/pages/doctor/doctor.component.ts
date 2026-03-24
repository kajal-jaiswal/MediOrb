import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SignalrService } from '../../services/signalr.service';
import { TriageService } from '../../services/triage.service';
import { PatientAlert } from '../../models/patient-queue.model';

const URGENCY_ORDER: Record<string, number> = {
  Emergency: 4, High: 3, Medium: 2, Low: 1,
};

const URGENCY_COLOR: Record<string, string> = {
  Emergency: '#EF4444', High: '#F97316', Medium: '#F59E0B', Low: '#10B981',
};

@Component({
  selector: 'app-doctor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doctor.component.html',
  styleUrls: ['./doctor.component.css'],
})
export class DoctorComponent implements OnInit, OnDestroy {
  queue = signal<PatientAlert[]>([]);
  selected = signal<PatientAlert | null>(null);
  isConnected = signal<boolean>(false);
  loadingQueue = signal<boolean>(true);
  actionLoading = signal<string>('');  // appointmentId being actioned

  private subs = new Subscription();

  // Sorted queue: Emergency first, then by time
  readonly sortedQueue = computed(() =>
    [...this.queue()].sort((a, b) => {
      const diff = (URGENCY_ORDER[b.urgencyLevel] ?? 2) - (URGENCY_ORDER[a.urgencyLevel] ?? 2);
      return diff !== 0 ? diff : new Date(a.checkedInAt).getTime() - new Date(b.checkedInAt).getTime();
    })
  );

  // Stats
  readonly totalWaiting  = computed(() => this.queue().filter(p => p.status === 'Waiting').length);
  readonly emergencies   = computed(() => this.queue().filter(p => p.urgencyLevel === 'Emergency').length);
  readonly highPriority  = computed(() => this.queue().filter(p => p.urgencyLevel === 'High').length);
  readonly inProgress    = computed(() => this.queue().filter(p => p.status === 'InProgress').length);

  constructor(
    private signalr: SignalrService,
    private triageService: TriageService,
  ) {}

  ngOnInit(): void {
    // Load existing queue from REST API
    this.triageService.getQueue().subscribe({
      next: q => { this.queue.set(q); this.loadingQueue.set(false); },
      error: () => { this.loadingQueue.set(false); },
    });

    // Connect to SignalR
    this.signalr.connect();

    this.subs.add(
      this.signalr.isConnected$.subscribe(v => this.isConnected.set(v))
    );

    // New patient arrives → add to top (after sort, it'll position itself)
    this.subs.add(
      this.signalr.newPatient$.subscribe(alert => {
        this.queue.update(q => {
          const exists = q.some(p => p.appointmentId === alert.appointmentId);
          return exists ? q : [...q, alert];
        });
      })
    );

    // Doctor action → update status in queue
    this.subs.add(
      this.signalr.statusUpdated$.subscribe(({ appointmentId, status }) => {
        this.queue.update(q =>
          q.map(p => p.appointmentId === appointmentId ? { ...p, status: status as any } : p)
           .filter(p => p.status !== 'Completed' && p.status !== 'Transferred')
        );
        if (this.selected()?.appointmentId === appointmentId) {
          const found = this.queue().find(p => p.appointmentId === appointmentId);
          this.selected.set(found ?? null);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.signalr.disconnect();
  }

  // ── UI helpers ───────────────────────────────────────────────

  selectPatient(p: PatientAlert): void {
    this.selected.set(this.selected()?.appointmentId === p.appointmentId ? null : p);
  }

  closeDetail(): void { this.selected.set(null); }

  urgencyColor(level: string): string {
    return URGENCY_COLOR[level] ?? '#F59E0B';
  }

  timeSince(isoStr: string): string {
    const mins = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  }

  // ── Doctor actions ───────────────────────────────────────────

  callPatient(p: PatientAlert): void    { this.updateStatus(p, 'InProgress'); }
  completeConsult(p: PatientAlert): void { this.updateStatus(p, 'Completed'); }
  transfer(p: PatientAlert): void       { this.updateStatus(p, 'Transferred'); }

  private updateStatus(p: PatientAlert, status: string): void {
    if (this.actionLoading()) return;
    this.actionLoading.set(p.appointmentId);

    this.triageService.updatePatientStatus(p.appointmentId, status).subscribe({
      next: () => {
        this.actionLoading.set('');
        if (status === 'Completed' || status === 'Transferred') {
          // Remove from queue
          this.queue.update(q => q.filter(x => x.appointmentId !== p.appointmentId));
          if (this.selected()?.appointmentId === p.appointmentId) this.selected.set(null);
        } else {
          // Update status in queue
          this.queue.update(q =>
            q.map(x => x.appointmentId === p.appointmentId ? { ...x, status: status as any } : x)
          );
          if (this.selected()?.appointmentId === p.appointmentId) {
            this.selected.update(s => s ? { ...s, status: status as any } : null);
          }
        }
      },
      error: () => { this.actionLoading.set(''); },
    });
  }
}
