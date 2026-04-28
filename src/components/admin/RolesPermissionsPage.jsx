import { useEffect, useState } from 'react';
import { FiRefreshCw, FiShield, FiUserCheck } from 'react-icons/fi';
import { getRolesPermissions, getUtilisateurs, modifierUtilisateur } from '../../api/adminAPI';
import {
  adminPalette,
  adminRefreshButton,
  adminSearchInput,
  adminSearchWrap,
  adminSectionPanel,
  adminSubStyle,
  adminTitleStyle,
  makeSoftBadge,
} from './adminTheme';

export default function RolesPermissionsPage() {
  const [matrix, setMatrix] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [rolesRes, usersRes] = await Promise.all([
        getRolesPermissions(),
        getUtilisateurs({ per_page: 50 }),
      ]);
      setMatrix(rolesRes.data?.matrix || []);
      setUsers(usersRes.data?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredUsers = users.filter((user) => {
    const haystack = `${user.prenom || ''} ${user.nom || ''} ${user.email || ''}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const updateRole = async (userId, role) => {
    setSavingUserId(userId);
    try {
      await modifierUtilisateur(userId, { role });
      await load();
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="page-header">
        <div>
          <h1 style={adminTitleStyle}>Roles et permissions</h1>
          <p style={adminSubStyle}>Matrice des droits par profil et attribution rapide des roles utilisateurs.</p>
        </div>
        <button onClick={load} style={adminRefreshButton}>
          <FiRefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }}>
        <div style={adminSectionPanel}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <FiShield color={adminPalette.primary} />
            <strong style={{ color: adminPalette.text }}>Matrice des permissions</strong>
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            {matrix.map((role) => (
              <div key={role.role} style={{ border: `1px solid ${adminPalette.border}`, borderRadius: 16, padding: 18, background: '#FCFFFD' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: adminPalette.text }}>{role.label}</div>
                  <span style={makeSoftBadge(adminPalette.primary)}>{role.total_users} utilisateur(s)</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {role.permissions.map((permission) => (
                    <span key={permission} style={{ ...makeSoftBadge(adminPalette.info), fontWeight: 600 }}>{permission}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={adminSectionPanel}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <FiUserCheck color={adminPalette.info} />
            <strong style={{ color: adminPalette.text }}>Attribution des roles</strong>
          </div>

          <div style={{ ...adminSearchWrap, marginBottom: 14 }}>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un utilisateur..."
              style={adminSearchInput}
            />
          </div>

          <div style={{ display: 'grid', gap: 12, maxHeight: 620, overflowY: 'auto' }}>
            {filteredUsers.map((user) => (
              <div key={user.id} style={{ border: `1px solid ${adminPalette.border}`, borderRadius: 14, padding: 14, background: '#fff' }}>
                <div style={{ fontWeight: 700, color: adminPalette.text }}>{user.prenom} {user.nom}</div>
                <div style={{ fontSize: 12, color: adminPalette.textMuted, marginTop: 4 }}>{user.email}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 12 }}>
                  <span style={makeSoftBadge(user.est_actif ? adminPalette.primary : adminPalette.warning)}>
                    {user.est_actif ? 'Actif' : 'Inactif'}
                  </span>
                  <select
                    value={user.role}
                    disabled={savingUserId === user.id}
                    onChange={(event) => updateRole(user.id, event.target.value)}
                    style={{ minWidth: 160, padding: '10px 12px', borderRadius: 10, border: `1px solid ${adminPalette.border}` }}
                  >
                    <option value="administrateur">Administrateur</option>
                    <option value="medecin">Medecin</option>
                    <option value="patient">Patient</option>
                    <option value="pharmacien">Pharmacien</option>
                    <option value="laborantin">Laborantin</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
