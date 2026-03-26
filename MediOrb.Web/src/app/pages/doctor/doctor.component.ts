import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import { SignalrService, ConnectionState } from '../../services/signalr.service';
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
  queue            = signal<PatientAlert[]>([]);
  selected         = signal<PatientAlert | null>(null);
  isConnected      = signal<boolean>(false);
  connectionState  = signal<ConnectionState>('connecting');
  loadingQueue     = signal<boolean>(true);
  actionLoading    = signal<string>('');  // appointmentId being actioned

  // ── Phase C: search / filter / sort ──────────────────────────
  readonly searchQuery    = signal('');
  readonly filterUrgency  = signal<string>('All');
  readonly sortMode       = signal<'urgency' | 'time'>('urgency');

  // Reactive tick — updated every 30 s so countdown labels refresh
  private readonly _tick  = signal(Date.now());

  readonly urgencyFilters = ['All', 'Emergency', 'High', 'Medium', 'Low'] as const;

  private subs = new Subscription();

  // ── Computed: filtered + sorted queue ────────────────────────
  readonly sortedQueue = computed(() => {
    let list = [...this.queue()];

    // 1. Filter by urgency
    const uf = this.filterUrgency();
    if (uf !== 'All') list = list.filter(p => p.urgencyLevel === uf);

    // 2. Search by patient name or symptoms
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(p =>
        p.patientName.toLowerCase().includes(q) ||
        p.symptoms.toLowerCase().includes(q)
      );
    }

    // 3. Sort
    return list.sort((a, b) => {
      if (this.sortMode() === 'time') {
        return new Date(a.checkedInAt).getTime() - new Date(b.checkedInAt).getTime();
      }
      // Default: urgency first, then arrival time
      const diff = (URGENCY_ORDER[b.urgencyLevel] ?? 2) - (URGENCY_ORDER[a.urgencyLevel] ?? 2);
      return diff !== 0 ? diff : new Date(a.checkedInAt).getTime() - new Date(b.checkedInAt).getTime();
    });
  });

  // Stats (based on full unfiltered queue)
  readonly totalWaiting = computed(() => this.queue().filter(p => p.status === 'Waiting').length);
  readonly emergencies  = computed(() => this.queue().filter(p => p.urgencyLevel === 'Emergency').length);
  readonly highPriority = computed(() => this.queue().filter(p => p.urgencyLevel === 'High').length);
  readonly inProgress   = computed(() => this.queue().filter(p => p.status === 'InProgress').length);

  constructor(
    private signalr: SignalrService,
    private triageService: TriageService,
  ) {}

  ngOnInit(): void {
    // Load existing queue from REST API
    this.triageService.getQueue().subscribe({
      next:  q => { this.queue.set(q); this.loadingQueue.set(false); },
      error: () => { this.loadingQueue.set(false); },
    });

    // SignalR connection
    this.signalr.connect();
    this.subs.add(this.signalr.isConnected$.subscribe(v => this.isConnected.set(v)));
    this.subs.add(this.signalr.connectionState$.subscribe(s => this.connectionState.set(s)));

    // New patient arrives
    this.subs.add(
      this.signalr.newPatient$.subscribe(alert => {
        this.queue.update(q => {
          const exists = q.some(p => p.appointmentId === alert.appointmentId);
          return exists ? q : [...q, alert];
        });
      })
    );

    // Doctor action → update status
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

    // Phase C: tick every 30 s to refresh countdown labels
    this.subs.add(
      interval(30_000).subscribe(() => this._tick.set(Date.now()))
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.signalr.disconnect();
  }

  // ── UI helpers ────────────────────────────────────────────────

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

  // Phase C: countdown helpers — use _tick() to register reactivity
  waitingMinutes(isoStr: string): number {
    const nowMs = this._tick(); // reactive — re-evaluates every 30 s
    return Math.floor((nowMs - new Date(isoStr).getTime()) / 60_000);
  }

  countdownLabel(isoStr: string, estimatedWaitTime: string): string {
    const waited   = this.waitingMinutes(isoStr);
    const estMatch = estimatedWaitTime.match(/\d+/);
    const est      = estMatch ? parseInt(estMatch[0], 10) : 20;
    const remaining = est - waited;

    if (remaining <= 0) return 'Overdue';
    if (remaining === 1) return '1m left';
    if (remaining <= 10) return `${remaining}m left`;
    return `~${remaining}m`;
  }

  isOverdue(isoStr: string, estimatedWaitTime: string): boolean {
    const waited   = this.waitingMinutes(isoStr);
    const estMatch = estimatedWaitTime.match(/\d+/);
    const est      = estMatch ? parseInt(estMatch[0], 10) : 20;
    return waited >= est;
  }

  // Phase C: clear all filters
  clearFilters(): void {
    this.searchQuery.set('');
    this.filterUrgency.set('All');
    this.sortMode.set('urgency');
  }

  // ── Doctor actions ────────────────────────────────────────────

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
          this.queue.update(q => q.filter(x => x.appointmentId !== p.appointmentId));
          if (this.selected()?.appointmentId === p.appointmentId) this.selected.set(null);
        } else {
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
