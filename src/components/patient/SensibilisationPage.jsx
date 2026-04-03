import { useState, useEffect } from 'react';
import { FiBookOpen, FiClock, FiUser, FiTag, FiChevronRight, FiX, FiSearch } from 'react-icons/fi';

const CATEGORIES = ['Toutes', 'Prévention', 'Nutrition', 'Cardiologie', 'Vaccination', 'Santé mentale'];

const SensibilisationPage = () => {
  const [articles, setArticles]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);
  const [categorie, setCategorie]     = useState('Toutes');
  const [search, setSearch]           = useState('');

  useEffect(() => {
    setArticles([]);
    setLoading(false);
  }, []);

  const filtered = articles.filter(a => {
    const matchCat = categorie === 'Toutes' || a.categorie === categorie;
    const matchSearch = !search || a.titre.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const CATEGORY_COLORS = {
    'Prévention':    { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
    'Nutrition':     { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
    'Cardiologie':   { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
    'Vaccination':   { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
    'Santé mentale': { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
  };

  const getColor = (cat) => CATEGORY_COLORS[cat] || { bg: '#F9FAFB', color: '#6B7280', border: '#E5E7EB' };

  if (loading) {
    return (
      <div className="loading-page">
        <span className="loading" />
        Chargement des articles…
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.35s ease' }}>
      {/* En-tête */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiBookOpen size={24} color="#16A34A" />
            Module de Sensibilisation
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
            Conseils santé et articles de prévention à votre disposition
          </p>
        </div>
      </div>

      {/* Bannière info */}
      <div style={bannerStyle}>
        <div style={bannerIconStyle}>💡</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 2 }}>
            Votre santé, votre responsabilité
          </div>
          <div style={{ fontSize: 13, color: '#6B7280' }}>
            Retrouvez ici des informations médicales validées pour vous aider à prendre soin de vous et de votre famille.
          </div>
        </div>
      </div>

      {/* Recherche + filtres */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <FiSearch size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un article, un tag…"
          />
        </div>
      </div>

      {/* Filtres catégories */}
      <div style={catFilterStyle}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategorie(cat)}
            style={{
              ...catBtnStyle,
              ...(categorie === cat
                ? { background: '#16A34A', color: '#fff', borderColor: '#16A34A' }
                : { background: '#fff', color: '#6B7280', borderColor: '#E5E7EB' })
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grille articles */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <FiBookOpen />
          <p>Aucun article trouvé pour cette sélection.</p>
        </div>
      ) : (
        <div style={gridStyle}>
          {filtered.map((article) => {
            const colors = getColor(article.categorie);
            return (
              <div
                key={article.id}
                className="card"
                style={cardStyle}
                onClick={() => setSelected(article)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{ ...catBadgeStyle, ...colors }}>
                    {article.categorie}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9CA3AF' }}>
                    <FiClock size={11} />
                    {article.duree}
                  </div>
                </div>

                <h3 style={cardTitleStyle}>{article.titre}</h3>

                <p style={cardExcerptStyle}>
                  {article.contenu.substring(0, 110)}…
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '12px 0' }}>
                  {article.tags.map(tag => (
                    <span key={tag} style={tagStyle}>
                      <FiTag size={9} /> {tag}
                    </span>
                  ))}
                </div>

                <div style={cardFooterStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280' }}>
                    <FiUser size={12} />
                    {article.auteur}
                  </div>
                  <button style={readMoreBtnStyle}>
                    Lire <FiChevronRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal article */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <span style={{ ...catBadgeStyle, ...getColor(selected.categorie), marginBottom: 10, display: 'inline-block' }}>
                  {selected.categorie}
                </span>
                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 800, color: '#111827', lineHeight: 1.3 }}>
                  {selected.titre}
                </h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#6B7280' }}
              >
                <FiX size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 20, fontSize: 13, color: '#6B7280' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><FiUser size={13} /> {selected.auteur}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><FiClock size={13} /> {selected.duree} de lecture</span>
              <span>{selected.date}</span>
            </div>

            <div className="divider" />

            <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.8 }}>
              {selected.contenu}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
              {selected.tags.map(tag => (
                <span key={tag} style={{ ...tagStyle, fontSize: 12, padding: '4px 10px' }}>
                  <FiTag size={10} /> {tag}
                </span>
              ))}
            </div>

            <div className="divider" />

            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '14px 16px', fontSize: 13, color: '#15803D' }}>
              <strong>Conseil DocSecur :</strong> Ces informations sont à titre éducatif. Consultez toujours un professionnel de santé pour un avis médical personnalisé.
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
};

const bannerStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 14,
  padding: '16px 20px',
  background: '#F0FDF4',
  border: '1px solid #BBF7D0',
  borderRadius: 12,
  marginBottom: 24,
};

const bannerIconStyle = {
  fontSize: 24,
  flexShrink: 0,
};

const catFilterStyle = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  marginBottom: 24,
};

const catBtnStyle = {
  padding: '6px 14px',
  borderRadius: 20,
  border: '1.5px solid',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  fontFamily: "'DM Sans', sans-serif",
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 18,
};

const cardStyle = {
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  padding: 20,
};

const catBadgeStyle = {
  padding: '3px 10px',
  borderRadius: 20,
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
  border: '1px solid',
  display: 'inline-block',
};

const cardTitleStyle = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 15,
  fontWeight: 700,
  color: '#111827',
  lineHeight: 1.4,
  marginBottom: 8,
};

const cardExcerptStyle = {
  fontSize: 13,
  color: '#6B7280',
  lineHeight: 1.6,
};

const tagStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '2px 8px',
  background: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: 20,
  fontSize: 11,
  color: '#6B7280',
};

const cardFooterStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: 12,
  borderTop: '1px solid #F3F4F6',
};

const readMoreBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 12,
  fontWeight: 700,
  color: '#16A34A',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontFamily: "'Outfit', sans-serif",
};

export default SensibilisationPage;
