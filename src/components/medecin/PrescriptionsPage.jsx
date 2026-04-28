import React, { useState, useEffect, useCallback } from 'react';
import {
  FiFileText, FiSearch, FiPlus, FiEye, FiSend,
  FiX, FiUser, FiCalendar, FiPackage
} from 'react-icons/fi';
import { getPrescriptions, creerPrescription, envoyerPharmacie, getPharmacies, getPatients, getHistorique } from '../../api/medecinAPI';
import { formatGeneratedRef, normalizeCollection, normalizeItem } from '../../utils/apiData';

const STATUT_MAP = {
  active:   { label: 'Active',    color: '#0ED2A0', bg: 'rgba(14,210,160,0.1)'  },
  envoyee:  { label: 'Envoyee',   color: '#16A34A', bg: 'rgba(22,163,74,0.12)'   },
  delivree: { label: 'Délivrée', color: '#38BDF8', bg: 'rgba(56,189,248,0.1)'  },
  expiree:  { label: 'Expirée',  color: '#F87171', bg: 'rgba(248,113,113,0.1)' },
};

const FILTER_TABS = [
  { key: 'all',      label: 'Toutes'    },
  { key: 'active',   label: 'Actives'   },
  { key: 'envoyee',  label: 'Envoyees'  },
  { key: 'delivree', label: 'Délivrées' },
  { key: 'expiree',  label: 'Expirées'  },
];

const EMPTY_MED = () => ({ nom: '', dosage: '', forme: 'comprime', posologie: '', duree: '', quantite: '' });

function normalizeMedicationForm(med = {}) {
  return {
    nom: med.nom || '',
    dosage: med.dosage || '',
    forme: med.forme || 'comprime',
    posologie: med.posologie || '',
    duree: med.duree || '',
    quantite: med.quantite || '',
  };
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getInitials(nom, prenom) {
  return `${(prenom || '')[0] || ''}${(nom || '')[0] || ''}`.toUpperCase();
}

function formatDoctorName(medecin) {
  if (!medecin) return '';
  if (typeof medecin === 'string') return medecin;

  const prenom = medecin.user?.prenom || medecin.prenom || '';
  const nom = medecin.user?.nom || medecin.nom || '';
  const fullName = [prenom, nom].filter(Boolean).join(' ').trim();

  return fullName ? `Dr. ${fullName}` : '';
}

const normalizePrescription = (prescription) => ({
  id: prescription.id,
  ref: prescription.ref || prescription.numero || formatGeneratedRef('PRESC', prescription.id),
  patient: {
    nom: prescription.patient?.nom || prescription.consultation?.dossierMedical?.patient?.user?.nom || '',
    prenom: prescription.patient?.prenom || prescription.consultation?.dossierMedical?.patient?.user?.prenom || '',
  },
  medecin: formatDoctorName(prescription.medecin),
  date_emission: prescription.date_emission,
  date_expiration: prescription.date_expiration,
  statut: prescription.statut || 'active',
  medicaments: Array.isArray(prescription.medicaments) ? prescription.medicaments.map((medicament) => ({
    nom: medicament.nom,
    posologie: medicament.pivot?.posologie || medicament.posologie || '—',
    duree: medicament.pivot?.duree_traitement || medicament.duree_traitement || '—',
    quantite: medicament.pivot?.quantite || medicament.quantite || '—',
  })) : [],
  envoye_pharmacie: Boolean(prescription.pharmacie_id || prescription.pharmacie),
});

const normalizeConsultationChoice = (consultation) => ({
  id: consultation.id,
  ref: consultation.ref || formatGeneratedRef('CONS', consultation.id),
  patientId: consultation.patient?.id || consultation.dossierMedical?.patient?.id || '',
  patientNomComplet: [
    consultation.patient?.prenom || consultation.dossierMedical?.patient?.user?.prenom || '',
    consultation.patient?.nom || consultation.dossierMedical?.patient?.user?.nom || '',
  ].filter(Boolean).join(' '),
});

const normalizePatientChoice = (patient) => ({
  id: patient.id,
  ref: patient.ref || patient.num_dossier || '',
  nom: patient.nom || patient.user?.nom || '',
  prenom: patient.prenom || patient.user?.prenom || '',
});

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [activeTab, setActiveTab]         = useState('all');
  const [selected, setSelected]           = useState(null);
  const [showCreate, setShowCreate]       = useState(false);
  const [toast, setToast]                 = useState(null);
  const [submitting, setSubmitting]       = useState(false);
  const [pharmacies, setPharmacies]       = useState([]);
  const [patients, setPatients]           = useState([]);
  const [availableConsultations, setAvailableConsultations] = useState([]);
  const [form, setForm] = useState({
    patient_id: '',
    consultation_id: '',
    date_emission: '',
    date_expiration: '',
    pharmacie_id: '',
    envoyer_auto_pharmacie: true,
    medicaments: [normalizeMedicationForm()],
  });

  useEffect(() => {
    (async () => {
      try {
        const [prescriptionsRes, pharmaciesRes, patientsRes] = await Promise.all([
          getPrescriptions(),
          getPharmacies(),
          getPatients({ per_page: 100 }),
        ]);
        setPrescriptions(normalizeCollection(prescriptionsRes).map(normalizePrescription));
        setPharmacies(Array.isArray(pharmaciesRes.data) ? pharmaciesRes.data : pharmaciesRes.data?.data || []);
        setPatients(normalizeCollection(patientsRes).map(normalizePatientChoice));
      } catch {
        setPrescriptions([]);
        setPharmacies([]);
        setPatients([]);
        setAvailableConsultations([]);
      }
      finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!form.patient_id) {
      setAvailableConsultations([]);
      return;
    }

    (async () => {
      try {
        const consultationsRes = await getHistorique(form.patient_id);
        setAvailableConsultations(normalizeCollection(consultationsRes).map(normalizeConsultationChoice));
      } catch {
        setAvailableConsultations([]);
      }
    })();
  }, [form.patient_id]);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const filtered = prescriptions.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = (
      p.patient?.nom?.toLowerCase().includes(q) ||
      p.patient?.prenom?.toLowerCase().includes(q) ||
      p.ref?.toLowerCase().includes(q)
    );
    const matchTab = activeTab === 'all' || p.statut === activeTab;
    return matchSearch && matchTab;
  });

  const kpis = [
    { label: 'Total',      value: prescriptions.length,                                    color: '#111827', bg: '#F3F4F6' },
    { label: 'Actives',    value: prescriptions.filter(p => p.statut === 'active').length,   color: '#0ED2A0', bg: 'rgba(14,210,160,0.1)'  },
    { label: 'Envoyees',   value: prescriptions.filter(p => p.statut === 'envoyee').length,  color: '#16A34A', bg: 'rgba(22,163,74,0.12)'   },
    { label: 'Délivrées', value: prescriptions.filter(p => p.statut === 'delivree').length, color: '#38BDF8', bg: 'rgba(56,189,248,0.1)'  },
    { label: 'Expirées',  value: prescriptions.filter(p => p.statut === 'expiree').length,  color: '#F87171', bg: 'rgba(248,113,113,0.1)' },
  ];

  /* ─── Handlers ──────────────────────────────────────────── */

  async function handleEnvoyer(id) {
    try {
      await envoyerPharmacie(id, pharmacies[0]?.id ? { pharmacie_id: pharmacies[0].id } : {});
    } catch (error) {
      showToast(error?.response?.data?.message || 'Envoi impossible', 'error');
      return;
    }
    setPrescriptions(prev => prev.map(p => (
      p.id === id ? { ...p, envoye_pharmacie: true, statut: 'envoyee' } : p
    )));
    showToast('Ordonnance envoyée à la pharmacie');
  }

  function updateMed(idx, field, value) {
    setForm(f => {
      const meds = [...f.medicaments];
      meds[idx] = { ...normalizeMedicationForm(meds[idx]), [field]: value };
      return { ...f, medicaments: meds };
    });
  }

  function addMed() {
    setForm(f => ({ ...f, medicaments: [...f.medicaments, normalizeMedicationForm()] }));
  }

  function removeMed(idx) {
    setForm(f => ({ ...f, medicaments: f.medicaments.filter((_, i) => i !== idx) }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    let created = false;
    const selectedConsultation = availableConsultations.find((consultation) => consultation.id === Number(form.consultation_id));
    const payload = {
      consultation_id: Number(form.consultation_id),
      date_emission: form.date_emission,
      date_expiration: form.date_expiration,
      pharmacie_id: form.pharmacie_id ? Number(form.pharmacie_id) : null,
      envoyer_auto_pharmacie: form.envoyer_auto_pharmacie,
      notes: selectedConsultation?.patientNomComplet
        ? `Prescription pour ${selectedConsultation.patientNomComplet}`
        : 'Prescription medicale',
      medicaments: form.medicaments.map((medicament) => {
        const normalizedMedicament = normalizeMedicationForm(medicament);

        return {
          nom: normalizedMedicament.nom.trim(),
          dosage: normalizedMedicament.dosage.trim(),
          forme: normalizedMedicament.forme || 'comprime',
          posologie: normalizedMedicament.posologie.trim(),
          duree_traitement: normalizedMedicament.duree ? Number(normalizedMedicament.duree) : null,
          quantite: normalizedMedicament.quantite ? Number(normalizedMedicament.quantite) : null,
        };
      }),
    };
    try {
      const res = await creerPrescription(payload);
      const createdPrescription = normalizePrescription(normalizeItem(res, 'prescription'));
      setPrescriptions(prev => [createdPrescription, ...prev]);
      created = true;
    } catch (error) {
      showToast(error?.response?.data?.message || 'Création impossible', 'error');
      setSubmitting(false);
      return;
    } finally {
      setSubmitting(false);
      if (created) {
        setShowCreate(false);
        setForm({ patient_id: '', consultation_id: '', date_emission: '', date_expiration: '', pharmacie_id: '', envoyer_auto_pharmacie: true, medicaments: [normalizeMedicationForm()] });
        setAvailableConsultations([]);
        showToast('Prescription créée avec succès');
      }
    }
  }

  const selectedConsultation = availableConsultations.find((consultation) => consultation.id === Number(form.consultation_id));
  const selectedPatient = patients.find((patient) => String(patient.id) === String(form.patient_id));

  /* ─── Render ────────────────────────────────────────────── */

  return (
    <div style={pageStyle}>
      <style>{keyframesCSS}</style>

      {/* Toast */}
      {toast && (
        <div style={{ ...toastStyle, background: toast.type === 'success' ? 'rgba(14,210,160,0.18)' : 'rgba(248,113,113,0.18)', borderColor: toast.type === 'success' ? 'rgba(14,210,160,0.35)' : 'rgba(248,113,113,0.35)' }}>
          <span style={{ color: toast.type === 'success' ? '#0ED2A0' : '#F87171', fontSize: 13, fontWeight: 600 }}>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div style={headerRow}>
        <div>
          <h1 style={titleStyle}>Prescriptions</h1>
          <p style={subtitleStyle}>{prescriptions.length} prescription{prescriptions.length !== 1 ? 's' : ''} au total</p>
        </div>
        <button style={addBtn} onClick={() => setShowCreate(true)}>
          <FiPlus size={16} /> Nouvelle prescription
        </button>
      </div>

      {/* KPIs */}
      <div style={{ ...kpiGrid, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ ...kpiCard, animationDelay: `${i * 80}ms` }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: k.color, fontFamily: "'Outfit',sans-serif", lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={toolbarRow}>
        <div style={searchWrap}>
          <FiSearch size={15} color="#9CA3AF" />
          <input style={searchInput} placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} style={clearBtn}><FiX size={13} /></button>}
        </div>
        <div style={tabsRow}>
          {FILTER_TABS.map(t => (
            <button key={t.key} style={activeTab === t.key ? activeTabBtn : tabBtn} onClick={() => setActiveTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={tableCard}>
        {loading ? (
          <div style={emptyState}><div style={spinner} /><p style={{ color: '#6B7280', marginTop: 16, fontSize: 13 }}>Chargement…</p></div>
        ) : filtered.length === 0 ? (
          <div style={emptyState}><FiFileText size={40} color="#D1D5DB" /><p style={{ color: '#9CA3AF', marginTop: 12, fontSize: 14 }}>Aucune prescription</p></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Réf','Patient','Émission','Expiration','Médicaments','Pharmacie','Statut','Actions'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => {
                const s = STATUT_MAP[p.statut] || STATUT_MAP.active;
                return (
                  <tr key={p.id} style={{ ...trStyle, animationDelay: `${idx * 50}ms` }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={tdStyle}><span style={{ fontSize: 12, color: '#6B7280', letterSpacing: '0.3px' }}>{p.ref}</span></td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={avatarSm}>{getInitials(p.patient?.nom, p.patient?.prenom)}</div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{p.patient?.prenom} {p.patient?.nom}</span>
                      </div>
                    </td>
                    <td style={tdStyle}><span style={{ fontSize: 13, color: '#4B5563' }}>{formatDate(p.date_emission)}</span></td>
                    <td style={tdStyle}><span style={{ fontSize: 13, color: '#4B5563' }}>{formatDate(p.date_expiration)}</span></td>
                    <td style={tdStyle}>
                      <span style={{ ...badge, color: '#A78BFA', background: 'rgba(167,139,250,0.12)' }}>
                        <FiPackage size={10} /> {p.medicaments?.length || 0} médicament{p.medicaments?.length !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {p.envoye_pharmacie
                        ? <span style={{ ...badge, color: '#0ED2A0', background: 'rgba(14,210,160,0.1)' }}>Envoyée</span>
                        : <span style={{ ...badge, color: '#6B7280', background: '#F3F4F6' }}>Non envoyée</span>
                      }
                    </td>
                    <td style={tdStyle}><span style={{ ...badge, color: s.color, background: s.bg }}>{s.label}</span></td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={iconBtn} onClick={() => setSelected(p)} title="Voir détails"><FiEye size={14} /></button>
                        {!p.envoye_pharmacie && (
                          <button
                            style={{ ...iconBtn, color: '#0ED2A0', borderColor: 'rgba(14,210,160,0.25)' }}
                            onClick={() => handleEnvoyer(p.id)}
                            title="Envoyer à la pharmacie"
                          >
                            <FiSend size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div style={overlay} onClick={() => setSelected(null)}>
          <div style={{ ...modal, animation: 'slideUp 0.25s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={avatarLg}>{getInitials(selected.patient?.nom, selected.patient?.prenom)}</div>
                <div>
                  <h2 style={{ ...titleStyle, fontSize: 20 }}>{selected.patient?.prenom} {selected.patient?.nom}</h2>
                  <p style={{ ...subtitleStyle, marginTop: 2 }}>{selected.ref}</p>
                </div>
              </div>
              <button style={closeBtn} onClick={() => setSelected(null)}><FiX size={16} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <DetailBox label="Médecin" value={selected.medecin} />
              <DetailBox label="Statut" value={STATUT_MAP[selected.statut]?.label || selected.statut} />
              <DetailBox label="Date d'émission" value={formatDate(selected.date_emission)} />
              <DetailBox label="Date d'expiration" value={formatDate(selected.date_expiration)} />
              <DetailBox label="Envoyée pharmacie" value={selected.envoye_pharmacie ? 'Oui' : 'Non'} />
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
                Médicaments ({selected.medicaments?.length || 0})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(selected.medicaments || []).map((m, i) => (
                  <div key={i} style={medCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#A78BFA', marginBottom: 4 }}>{m.nom}</div>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>
                          {m.posologie} · {m.duree}
                        </div>
                      </div>
                      <span style={{ ...badge, color: '#A78BFA', background: 'rgba(167,139,250,0.12)', flexShrink: 0 }}>
                        Qté : {m.quantite}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div style={overlay} onClick={() => setShowCreate(false)}>
          <div style={{ ...modal, maxWidth: 680, animation: 'slideUp 0.25s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ ...titleStyle, fontSize: 20 }}>Nouvelle prescription</h2>
              <button style={closeBtn} onClick={() => setShowCreate(false)}><FiX size={16} /></button>
            </div>
            <form onSubmit={handleCreate}>
              {/* Patient + dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Patient</label>
                  <select
                    style={inputSelect}
                    value={form.patient_id}
                    onChange={e => {
                      const patientId = e.target.value;
                      setForm(f => ({
                        ...f,
                        patient_id: patientId,
                        consultation_id: '',
                      }));
                    }}
                    required
                  >
                    <option value="">Selectionner un patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {(patient.ref || 'Sans numero')} - {[patient.prenom, patient.nom].filter(Boolean).join(' ') || 'Patient'}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedPatient && (
                  <div style={{ gridColumn: '1 / -1', ...selectedPatientCardStyle }}>
                    <div style={selectedPatientTitleStyle}>Patient selectionne</div>
                    <div style={selectedPatientTextStyle}>
                      {(selectedPatient.ref || 'Sans numero')} · {[selectedPatient.prenom, selectedPatient.nom].filter(Boolean).join(' ')}
                    </div>
                  </div>
                )}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Consultation</label>
                  <select
                    style={inputSelect}
                    value={form.consultation_id}
                    onChange={e => {
                      const consultationId = e.target.value;
                      const consultation = availableConsultations.find((item) => String(item.id) === consultationId);
                      setForm(f => ({
                        ...f,
                        consultation_id: consultationId,
                        patient_id: consultation?.patientId ? String(consultation.patientId) : f.patient_id,
                      }));
                    }}
                    required
                    disabled={!form.patient_id}
                  >
                    <option value="">
                      {form.patient_id ? 'Selectionner une consultation' : 'Selectionner d abord un patient'}
                    </option>
                    {availableConsultations.map((consultation) => (
                      <option key={consultation.id} value={consultation.id}>
                        {consultation.ref} - {consultation.patientNomComplet || 'Patient'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Date d'émission</label>
                  <div style={inputWrap}>
                    <FiCalendar size={14} color="#9CA3AF" />
                    <input style={{ ...inputStyle, colorScheme: 'light' }} type="date" value={form.date_emission} onChange={e => setForm(f => ({ ...f, date_emission: e.target.value }))} required />
                  </div>
                </div>
                <div style={{ gridColumn: '2 / 4' }}>
                  <label style={labelStyle}>Date d'expiration</label>
                  <div style={inputWrap}>
                    <FiCalendar size={14} color="#9CA3AF" />
                    <input style={{ ...inputStyle, colorScheme: 'light' }} type="date" value={form.date_expiration} onChange={e => setForm(f => ({ ...f, date_expiration: e.target.value }))} required />
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ ...inputWrap, background: '#F9FAFB' }}>
                    <FiUser size={14} color="#9CA3AF" />
                    <input
                      style={inputStyle}
                      value={selectedConsultation?.patientNomComplet || ''}
                      placeholder="Le patient selectionne apparaitra ici"
                      readOnly
                    />
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Pharmacie destinataire</label>
                  <select style={inputSelect} value={form.pharmacie_id} onChange={e => setForm(f => ({ ...f, pharmacie_id: e.target.value }))}>
                    <option value="">Selectionner une pharmacie ou laisser DocSecur choisir</option>
                    {pharmacies.map((pharmacie) => (
                      <option key={pharmacie.id} value={pharmacie.id}>
                        {pharmacie.nom} {pharmacie.adresse ? `- ${pharmacie.adresse}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10, marginTop: -4 }}>
                  <input
                    id="envoyer-auto-pharmacie"
                    type="checkbox"
                    checked={form.envoyer_auto_pharmacie}
                    onChange={e => setForm(f => ({ ...f, envoyer_auto_pharmacie: e.target.checked }))}
                  />
                  <label htmlFor="envoyer-auto-pharmacie" style={{ fontSize: 13, color: '#374151' }}>
                    Envoyer automatiquement l ordonnance a la pharmacie apres creation
                  </label>
                </div>
                {pharmacies.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', color: '#6B7280', fontSize: 12 }}>
                    Aucune pharmacie chargee dans la vue. Le backend creera et utilisera automatiquement une pharmacie par defaut si necessaire.
                  </div>
                )}
              </div>

              {/* Medicaments */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Médicaments</label>
                  <button type="button" style={addMedBtn} onClick={addMed}>
                    <FiPlus size={13} /> Ajouter un médicament
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {form.medicaments.map((m, idx) => (
                    <div key={idx} style={medFormRow}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 80px', gap: 10, flex: 1 }}>
                        <div style={inputWrap}>
                          <FiPackage size={13} color="#9CA3AF" />
                          <input style={inputStyle} placeholder="Nom du médicament" value={m.nom || ''} onChange={e => updateMed(idx, 'nom', e.target.value)} required />
                        </div>
                        <div style={inputWrap}>
                          <input style={inputStyle} placeholder="Dosage" value={m.dosage || ''} onChange={e => updateMed(idx, 'dosage', e.target.value)} />
                        </div>
                        <div style={inputWrap}>
                          <select style={inputStyle} value={m.forme || 'comprime'} onChange={e => updateMed(idx, 'forme', e.target.value)} required>
                            <option value="comprime">Comprime</option>
                            <option value="sirop">Sirop</option>
                            <option value="injection">Injection</option>
                            <option value="pommade">Pommade</option>
                            <option value="gelule">Gelule</option>
                            <option value="autre">Autre</option>
                          </select>
                        </div>
                        <div style={inputWrap}>
                          <input style={inputStyle} placeholder="Posologie" value={m.posologie || ''} onChange={e => updateMed(idx, 'posologie', e.target.value)} required />
                        </div>
                        <div style={inputWrap}>
                          <input style={inputStyle} placeholder="Durée" value={m.duree || ''} onChange={e => updateMed(idx, 'duree', e.target.value)} required />
                        </div>
                        <div style={inputWrap}>
                          <input style={{ ...inputStyle, width: '100%' }} type="number" placeholder="Qté" min={1} value={m.quantite || ''} onChange={e => updateMed(idx, 'quantite', e.target.value)} required />
                        </div>
                      </div>
                      {form.medicaments.length > 1 && (
                        <button type="button" style={removeMedBtn} onClick={() => removeMed(idx)}>
                          <FiX size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" style={cancelBtn} onClick={() => setShowCreate(false)}>Annuler</button>
                <button type="submit" style={submitBtn} disabled={submitting}>
                  {submitting ? <div style={{ ...spinner, width: 16, height: 16, borderWidth: 2 }} /> : <FiPlus size={14} />}
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailBox({ label, value }) {
  return (
    <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: '12px 14px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{value || '—'}</div>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────── */

const keyframesCSS = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes toastIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
`;

const pageStyle = {
  fontFamily: "'DM Sans',sans-serif",
  minHeight: '100vh',
  padding: '32px 28px',
  background: '#F6FBF8',
  color: '#111827',
  animation: 'fadeIn 0.4s ease',
};

const headerRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 28,
};

const titleStyle = {
  fontFamily: "'Outfit',sans-serif",
  fontSize: 26,
  fontWeight: 800,
  color: '#111827',
  letterSpacing: '-0.5px',
  margin: 0,
};

const subtitleStyle = {
  fontSize: 13,
  color: '#6B7280',
  marginTop: 4,
};

const kpiGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 16,
  marginBottom: 24,
};

const kpiCard = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: 16,
  padding: '20px 22px',
  animation: 'slideUp 0.35s ease both',
};

const toolbarRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 16,
  flexWrap: 'wrap',
};

const searchWrap = {
  flex: 1,
  minWidth: 200,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  background: '#FFFFFF',
  border: '1px solid #D1D5DB',
  borderRadius: 10,
  padding: '10px 14px',
};

const searchInput = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  color: '#111827',
  fontSize: 13,
  fontFamily: "'DM Sans',sans-serif",
  outline: 'none',
};

const clearBtn = {
  background: 'transparent',
  border: 'none',
  color: '#9CA3AF',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
};

const tabsRow = {
  display: 'flex',
  gap: 6,
};

const tabBtn = {
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid #D1D5DB',
  background: 'transparent',
  color: '#6B7280',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "'DM Sans',sans-serif",
  transition: 'all 0.15s',
};

const activeTabBtn = {
  ...tabBtn,
  background: 'rgba(14,210,160,0.12)',
  border: '1px solid rgba(14,210,160,0.3)',
  color: '#0ED2A0',
};

const addBtn = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 20px',
  background: '#16A34A',
  border: '1px solid #15803D',
  borderRadius: 12,
  color: '#FFFFFF',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: "'Outfit',sans-serif",
};

const tableCard = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: 20,
  overflow: 'hidden',
};

const thStyle = {
  padding: '14px 16px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 700,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
  borderBottom: '1px solid #E5E7EB',
  background: '#F9FAFB',
};

const tdStyle = {
  padding: '14px 16px',
  borderBottom: '1px solid #E5E7EB',
};

const trStyle = {
  transition: 'background 0.15s',
  animation: 'fadeIn 0.3s ease both',
};

const badge = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 10px',
  borderRadius: 20,
  fontSize: 11,
  fontWeight: 700,
};

const avatarSm = {
  width: 34,
  height: 34,
  borderRadius: 10,
  background: 'linear-gradient(135deg,#16A34A,#15803D)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
  fontWeight: 800,
  color: '#FFFFFF',
  flexShrink: 0,
  fontFamily: "'Outfit',sans-serif",
};

const avatarLg = {
  width: 56,
  height: 56,
  borderRadius: 16,
  background: 'linear-gradient(135deg,#0ED2A0,#0BA882)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 18,
  fontWeight: 800,
  color: '#fff',
  flexShrink: 0,
  fontFamily: "'Outfit',sans-serif",
};

const iconBtn = {
  padding: '6px 8px',
  borderRadius: 8,
  border: '1px solid #D1D5DB',
  background: '#F9FAFB',
  color: '#4B5563',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
};

const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(17,24,39,0.32)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 20,
};

const modal = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: 24,
  padding: 32,
  width: '100%',
  maxWidth: 640,
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 24px 60px rgba(15, 23, 42, 0.16)',
};

const closeBtn = {
  background: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  color: '#4B5563',
  cursor: 'pointer',
  padding: '6px 8px',
  display: 'flex',
  alignItems: 'center',
};

const inputWrap = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  background: '#FFFFFF',
  border: '1px solid #D1D5DB',
  borderRadius: 10,
  padding: '10px 14px',
};

const inputStyle = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  color: '#111827',
  fontSize: 13,
  fontFamily: "'DM Sans',sans-serif",
  outline: 'none',
  minWidth: 0,
};

const labelStyle = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: 8,
};

const selectedPatientCardStyle = {
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid rgba(14,210,160,0.2)',
  background: 'rgba(14,210,160,0.08)',
};

const selectedPatientTitleStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: '#15803D',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: 4,
};

const selectedPatientTextStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: '#111827',
};

const submitBtn = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 24px',
  borderRadius: 10,
  border: '1px solid #15803D',
  background: '#16A34A',
  color: '#FFFFFF',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 700,
  fontFamily: "'Outfit',sans-serif",
};

const cancelBtn = {
  padding: '10px 20px',
  borderRadius: 10,
  border: '1px solid #D1D5DB',
  background: '#F9FAFB',
  color: '#4B5563',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
};

const emptyState = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 180,
};

const spinner = {
  width: 32,
  height: 32,
  border: '3px solid rgba(14,210,160,0.15)',
  borderTop: '3px solid #0ED2A0',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

const toastStyle = {
  position: 'fixed',
  top: 24,
  right: 24,
  zIndex: 2000,
  padding: '12px 20px',
  borderRadius: 12,
  border: '1px solid',
  backdropFilter: 'blur(10px)',
  animation: 'toastIn 0.3s ease',
  boxShadow: '0 8px 32px rgba(15, 23, 42, 0.18)',
};

const medCard = {
  background: '#FAF5FF',
  border: '1px solid #E9D5FF',
  borderRadius: 12,
  padding: '14px 16px',
};

const medFormRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const addMedBtn = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 14px',
  borderRadius: 8,
  border: '1px solid rgba(14,210,160,0.3)',
  background: 'rgba(14,210,160,0.08)',
  color: '#0ED2A0',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 700,
  fontFamily: "'DM Sans',sans-serif",
};

const removeMedBtn = {
  padding: '8px',
  borderRadius: 8,
  border: '1px solid rgba(248,113,113,0.2)',
  background: 'rgba(248,113,113,0.08)',
  color: '#F87171',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
};

const inputSelect = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 12,
  border: '1px solid #E5E7EB',
  background: '#FFFFFF',
  color: '#111827',
  fontSize: 13,
  outline: 'none',
};
