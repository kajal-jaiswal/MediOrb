export interface DoctorInfo {
  name: string;
  specialty: string;
  floor: string;
  room: string;
  available: boolean;
}

export interface TriageResult {
  urgencyLevel: 'Low' | 'Medium' | 'High' | 'Emergency';
  recommendedDoctor: DoctorInfo;
  estimatedWaitTime: string;
  reasoning: string;
  suggestedTests: string[];
  additionalNotes?: string;
  // Phase B additions — optional, backend may not always return these
  confidence?:       number;
  primaryCondition?: string;
}
