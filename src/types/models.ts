/**
 * DocSecur — Types TypeScript des entités métier
 */

// ─────────────────────────────────────────────
// UTILISATEUR
// ─────────────────────────────────────────────

export type Role = 'medecin' | 'patient' | 'pharmacien' | 'administrateur' | 'laborantin';

export interface User {
  id: number;
  email: string;
  prenom: string;
  nom: string;
  role: Role;
  telephone?: string;
  avatar?: string;
  centre_sante_id?: number;
  created_at?: string;
  updated_at?: string;
}

// ─────────────────────────────────────────────
// PATIENT
// ─────────────────────────────────────────────

export type Sexe = 'M' | 'F';
export type GroupeSanguin = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface Patient {
  id: number;
  user_id: number;
  prenom: string;
  nom: string;
  date_naissance: string;
  sexe: Sexe;
  telephone: string;
  adresse?: string;
  groupe_sanguin?: GroupeSanguin;
  allergies?: string;
  antecedents?: string;
  qr_code?: string;
  created_at?: string;
}

// ─────────────────────────────────────────────
// CONSULTATION
// ─────────────────────────────────────────────

export interface Consultation {
  id: number;
  patient_id: number;
  medecin_id: number;
  date_consultation: string;
  motif: string;
  diagnostic: string;
  traitement?: string;
  notes?: string;
  tension?: string;
  temperature?: number;
  poids?: number;
  taille?: number;
  patient?: Patient;
  medecin?: User;
  created_at?: string;
}

// ─────────────────────────────────────────────
// PRESCRIPTION
// ─────────────────────────────────────────────

export type StatutPrescription = 'active' | 'terminee' | 'en_attente' | 'delivree';

export interface Medicament {
  nom: string;
  dosage: string;
  posologie: string;
  duree: string;
  quantite?: number;
}

export interface Prescription {
  id: number;
  patient_id: number;
  medecin_id: number;
  consultation_id?: number;
  date_prescription: string;
  statut: StatutPrescription;
  medicaments: Medicament[];
  notes?: string;
  consultation_motif?: string;
  medecin?: string | User;
  patient?: Patient;
  created_at?: string;
}

// ─────────────────────────────────────────────
// RENDEZ-VOUS
// ─────────────────────────────────────────────

export type StatutRdv = 'planifie' | 'confirme' | 'annule' | 'termine' | 'en_attente';

export interface RendezVous {
  id: number;
  patient_id: number;
  medecin_id: number;
  date_rdv: string;
  heure?: string;
  motif: string;
  statut: StatutRdv;
  notes?: string;
  lieu?: string;
  patient?: Patient;
  medecin?: User;
  created_at?: string;
}

// ─────────────────────────────────────────────
// RÉSULTAT D'ANALYSE
// ─────────────────────────────────────────────

export type StatutResultat = 'normal' | 'anormal' | 'en_cours';

export interface ResultatAnalyse {
  id: number;
  patient_id: number;
  laborantin_id?: number;
  medecin_id?: number;
  type_analyse: string;
  date_prelevement: string;
  date_resultat?: string;
  statut: StatutResultat;
  resultats_details?: string;
  fichier_url?: string;
  laborantin?: string | User;
  medecin_prescripteur?: string;
  created_at?: string;
}

// ─────────────────────────────────────────────
// VACCINATION
// ─────────────────────────────────────────────

export interface Vaccination {
  id: number;
  patient_id: number;
  vaccin: string;
  date_vaccination: string;
  dose?: string;
  lot?: string;
  prochain_rappel?: string;
  centre?: string;
  created_at?: string;
}

// ─────────────────────────────────────────────
// CENTRE DE SANTÉ
// ─────────────────────────────────────────────

export type TypeCentre = 'hopital' | 'clinique' | 'centre_sante' | 'poste_sante';

export interface CentreSante {
  id: number;
  nom: string;
  adresse: string;
  telephone?: string;
  type: TypeCentre;
  region: string;
  coordonnees_gps?: string;
  medecins_count?: number;
  created_at?: string;
}

// ─────────────────────────────────────────────
// NOTIFICATION
// ─────────────────────────────────────────────

export interface Notification {
  id: number;
  user_id: number;
  titre: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  lue: boolean;
  created_at: string;
}

// ─────────────────────────────────────────────
// MESSAGE
// ─────────────────────────────────────────────

export interface Message {
  id: number;
  expediteur_id: number;
  destinataire_id: number;
  contenu: string;
  lu: boolean;
  created_at: string;
  expediteur?: User;
  destinataire?: User;
}

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface OTPRequest {
  telephone: string;
}

export interface OTPVerify {
  telephone: string;
  otp: string;
}

// ─────────────────────────────────────────────
// RÉPONSES API
// ─────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  last_page: number;
}
