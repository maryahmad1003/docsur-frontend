/**
 * DocSecur — Point d'entrée des types
 * Import centralisé : import type { Patient, Prescription } from '@/types';
 */

export type {
  Role,
  User,
  AuthState,
  LoginCredentials,
  OTPRequest,
  OTPVerify,
  Patient,
  Sexe,
  GroupeSanguin,
  Consultation,
  Prescription,
  StatutPrescription,
  Medicament,
  RendezVous,
  StatutRdv,
  ResultatAnalyse,
  StatutResultat,
  Vaccination,
  CentreSante,
  TypeCentre,
  Notification,
  Message,
  ApiResponse,
  PaginatedResponse,
} from './models';
