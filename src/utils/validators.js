/**
 * DocSecur — Utilitaires de validation
 */

/**
 * Vérifie qu'un email est valide.
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Vérifie qu'un numéro de téléphone sénégalais est valide.
 * Accepte : 77xxxxxxx, 78xxxxxxx, 76xxxxxxx, 70xxxxxxx, 33xxxxxxx (fixe)
 */
export const isValidTelephone = (tel) => {
  if (!tel) return false;
  const cleaned = tel.replace(/\D/g, '');
  if (cleaned.startsWith('221')) {
    return cleaned.length === 12;
  }
  return /^(77|78|76|70|33|75)\d{7}$/.test(cleaned);
};

/**
 * Vérifie qu'un mot de passe respecte les règles minimales.
 * Minimum 8 caractères.
 */
export const isValidPassword = (password) => {
  if (!password) return false;
  return password.length >= 8;
};

/**
 * Vérifie qu'un OTP est valide (6 chiffres).
 */
export const isValidOTP = (otp) => {
  if (!otp) return false;
  return /^\d{6}$/.test(otp);
};

/**
 * Vérifie qu'une date de naissance est valide et cohérente.
 * Le patient doit avoir entre 0 et 120 ans.
 */
export const isValidDateNaissance = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const age = new Date().getFullYear() - d.getFullYear();
  return age >= 0 && age <= 120;
};

/**
 * Vérifie qu'un champ obligatoire est rempli.
 */
export const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

/**
 * Retourne les erreurs de validation d'un formulaire de connexion.
 * @returns {Object} { email?: string, password?: string }
 */
export const validateLoginForm = ({ email, password }) => {
  const errors = {};
  if (!isRequired(email)) errors.email = "L'email est requis.";
  else if (!isValidEmail(email)) errors.email = "Format d'email invalide.";
  if (!isRequired(password)) errors.password = "Le mot de passe est requis.";
  else if (!isValidPassword(password)) errors.password = "Minimum 8 caractères.";
  return errors;
};

/**
 * Retourne les erreurs de validation du formulaire patient (connexion OTP).
 */
export const validateOTPForm = ({ telephone, otp }) => {
  const errors = {};
  if (!isRequired(telephone)) errors.telephone = "Le numéro de téléphone est requis.";
  else if (!isValidTelephone(telephone)) errors.telephone = "Numéro de téléphone sénégalais invalide.";
  if (otp !== undefined && !isValidOTP(otp)) errors.otp = "Le code OTP doit être 6 chiffres.";
  return errors;
};
