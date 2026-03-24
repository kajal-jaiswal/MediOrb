import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any;

@Injectable({ providedIn: 'root' })
export class SpeechService {
  readonly transcript$  = new BehaviorSubject<string>('');
  readonly isListening$ = new BehaviorSubject<boolean>(false);
  readonly isSpeaking$  = new BehaviorSubject<boolean>(false);
  readonly error$       = new BehaviorSubject<string | null>(null);

  readonly supported: boolean;

  private recognition: AnySpeechRecognition = null;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private finalizedText = '';
  private langCode = 'en-US';

  constructor() {
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    this.supported = !!SR && !!window.speechSynthesis;
  }

  setLanguage(code: string): void { this.langCode = code; }

  startListening(): void {
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) { this.error$.next('Speech recognition not supported in this browser.'); return; }

    this.stopListening();
    this.error$.next(null);
    this.finalizedText = '';
    this.transcript$.next('');

    this.recognition = new SR();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.langCode;

    this.recognition.onstart = () => {
      this.isListening$.next(true);
      this.resetSilenceTimer();
    };

    this.recognition.onend = () => {
      this.isListening$.next(false);
      this.clearSilenceTimer();
    };

    this.recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech') {
        this.error$.next('Microphone error. Please type your symptoms instead.');
      }
      this.isListening$.next(false);
      this.clearSilenceTimer();
    };

    this.recognition.onresult = (e: any) => {
      this.resetSilenceTimer();
      let interimTranscript = '';

      // Start from e.resultIndex (not 0) to avoid reprocessing already-finalized
      // results — the root cause of duplicate transcripts on mobile Chrome/Safari.
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const segment = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          this.finalizedText += segment.trimEnd() + ' ';
        } else {
          interimTranscript += segment;
        }
      }

      this.transcript$.next((this.finalizedText + interimTranscript).trimStart());
    };

    this.recognition.start();
  }

  stopListening(): void {
    this.recognition?.stop();
    this.recognition = null;
    this.clearSilenceTimer();
    this.isListening$.next(false);
  }

  speak(text: string, lang?: string): void {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.lang = lang ?? this.langCode;
    u.onstart = () => this.isSpeaking$.next(true);
    u.onend   = () => this.isSpeaking$.next(false);
    u.onerror = () => this.isSpeaking$.next(false);
    window.speechSynthesis.speak(u);
  }

  resetTranscript(): void {
    this.finalizedText = '';
    this.transcript$.next('');
  }

  private resetSilenceTimer(): void {
    this.clearSilenceTimer();
    this.silenceTimer = setTimeout(() => this.stopListening(), 6000);
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer) { clearTimeout(this.silenceTimer); this.silenceTimer = null; }
  }
}
