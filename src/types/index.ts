export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  address?: string;
  medicalHistory?: string;
  allergies?: string;
  bloodType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Visit {
  id: string;
  patient: Patient;
  visitDate: string;
  reason: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  followUpDate: string | null;
  createdAt: string;
  updatedAt: string;
  studyInstanceUid: string | null;
}

export interface VisitWithPatient extends Visit {
  patient?: Patient;
}
