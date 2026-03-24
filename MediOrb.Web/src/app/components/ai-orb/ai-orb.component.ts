import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  trigger, state, style, animate, transition,
} from '@angular/animations';

export type OrbState = 'idle' | 'listening' | 'processing' | 'speaking' | 'success';

@Component({
  selector: 'app-ai-orb',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-orb.component.html',
  styleUrls: ['./ai-orb.component.css'],
  animations: [
    trigger('orbGlow', [
      state('idle',       style({ opacity: 1 })),
      state('listening',  style({ opacity: 1 })),
      state('processing', style({ opacity: 1 })),
      state('speaking',   style({ opacity: 1 })),
      state('success',    style({ opacity: 1 })),
      transition('* <=> *', animate('400ms ease-in-out')),
    ]),
  ],
})
export class AiOrbComponent implements OnChanges {
  @Input() orbState: OrbState = 'idle';
  @Input() size: number = 160;

  bars      = [0.5, 0.8, 1, 0.7, 0.9, 0.6, 1];
  speakBars = [0.4, 0.9, 0.6, 1, 0.5, 0.8, 0.7, 0.95, 0.55];

  get orbColors(): { core: string; glow: string } {
    switch (this.orbState) {
      case 'listening':  return { core: 'rose',    glow: 'rgba(244,63,94,0.5)'   };
      case 'processing': return { core: 'violet',  glow: 'rgba(139,92,246,0.5)'  };
      case 'speaking':   return { core: 'cyan',    glow: 'rgba(6,182,212,0.5)'   };
      case 'success':    return { core: 'emerald', glow: 'rgba(16,185,129,0.5)'  };
      default:           return { core: 'indigo',  glow: 'rgba(99,102,241,0.4)'  };
    }
  }

  ngOnChanges(): void {}
}
