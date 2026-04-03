/**
 * DocSecur — Utilitaires de date
 */

/**
 * Formate une date ISO en format français lisible.
 * Ex : "2026-03-15T09:00:00Z" → "15 mars 2026"
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Formate une date en format court.
 * Ex : "2026-03-15" → "15/03/2026"
 */
export const formatDateCourt = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR');
};

/**
 * Formate une date avec heure.
 * Ex : "2026-03-15T09:30:00Z" → "15/03/2026 à 09:30"
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
};

/**
 * Retourne une date relative en français.
 * Ex : "Il y a 3 jours", "Aujourd'hui", "Dans 2 heures"
 */
export const formatDateRelative = (dateStr) => {
  if (!dateStr) return '—';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = date - now;
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffH = Math.round(diffMin / 60);
  const diffD = Math.round(diffH / 24);

  if (Math.abs(diffD) === 0) return "Aujourd'hui";
  if (diffD === 1) return 'Demain';
  if (diffD === -1) return 'Hier';
  if (diffD > 0) return `Dans ${diffD} jour${diffD > 1 ? 's' : ''}`;
  return `Il y a ${Math.abs(diffD)} jour${Math.abs(diffD) > 1 ? 's' : ''}`;
};

/**
 * Calcule l'âge à partir d'une date de naissance.
 * Ex : "1990-05-20" → 35
 */
export const calculerAge = (dateNaissance) => {
  if (!dateNaissance) return null;
  const today = new Date();
  const birth = new Date(dateNaissance);
  let age = today.getFullYear() - birth.getFullYear();
  const mois = today.getMonth() - birth.getMonth();
  if (mois < 0 || (mois === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

/**
 * Vérifie si une date est passée.
 */
export const estPasse = (dateStr) => {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
};

/**
 * Vérifie si une date est aujourd'hui.
 */
export const estAujourdhui = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  return d.toDateString() === today.toDateString();
};
