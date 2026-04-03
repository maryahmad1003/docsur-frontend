/**
 * DocSecur — Utilitaires de formatage
 */

/**
 * Formate un numéro de téléphone sénégalais.
 * Ex : "221771234567" → "+221 77 123 45 67"
 */
export const formatTelephone = (tel) => {
  if (!tel) return '—';
  const cleaned = tel.replace(/\D/g, '');
  if (cleaned.startsWith('221') && cleaned.length === 12) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10)}`;
  }
  if (cleaned.length === 9) {
    return `+221 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7)}`;
  }
  return tel;
};

/**
 * Formate le nom complet d'un utilisateur.
 * Ex : { prenom: "Awa", nom: "Diallo" } → "Awa Diallo"
 */
export const formatNomComplet = (user) => {
  if (!user) return '—';
  const prenom = user.prenom || user.first_name || '';
  const nom = user.nom || user.last_name || '';
  return `${prenom} ${nom}`.trim() || '—';
};

/**
 * Retourne les initiales d'un nom complet.
 * Ex : "Awa Diallo" → "AD"
 */
export const getInitiales = (nomComplet) => {
  if (!nomComplet) return '?';
  return nomComplet
    .split(' ')
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .slice(0, 2)
    .join('');
};

/**
 * Tronque un texte à une longueur max avec ellipsis.
 * Ex : truncateText("Inflammation chronique", 10) → "Inflammati…"
 */
export const truncateText = (text, max = 50) => {
  if (!text) return '—';
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

/**
 * Capitalise la première lettre d'une chaîne.
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Formate un statut de rendez-vous en label lisible.
 */
export const formatStatutRdv = (statut) => {
  const labels = {
    planifie: 'Planifié',
    confirme: 'Confirmé',
    annule: 'Annulé',
    termine: 'Terminé',
    en_attente: 'En attente',
  };
  return labels[statut] || capitalize(statut) || '—';
};

/**
 * Formate un statut de prescription.
 */
export const formatStatutPrescription = (statut) => {
  const labels = {
    active: 'Active',
    terminee: 'Terminée',
    en_attente: 'En attente',
    delivree: 'Délivrée',
  };
  return labels[statut] || capitalize(statut) || '—';
};

/**
 * Génère un identifiant patient aléatoire pour affichage.
 * Ex : "PAT-00042"
 */
export const formatIdPatient = (id) => {
  if (!id) return '—';
  return `PAT-${String(id).padStart(5, '0')}`;
};

/**
 * Génère une référence d'ordonnance.
 * Ex : "ORD-000015"
 */
export const formatIdOrdonnance = (id) => {
  if (!id) return '—';
  return `ORD-${String(id).padStart(6, '0')}`;
};
