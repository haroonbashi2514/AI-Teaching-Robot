import { useEffect, useState } from 'react';
import { API, apiFetch } from '../lib/api';
import { Contact, RefreshCw, Save } from 'lucide-react';

interface PersonProfile {
  name: string;
  role?: string;
  first_seen?: string;
  last_seen?: string;
  times_seen?: number;
  face_file?: string;
}

export default function PeoplePage() {
  const [profiles, setProfiles] = useState<PersonProfile[]>([]);
  const [intro, setIntro] = useState('This is Kousalya our HOD');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProfiles(); }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data } = await apiFetch<{ items: PersonProfile[] }>(API.peopleProfiles);
    if (data) setProfiles(data.items);
    setLoading(false);
  };

  const introduce = async () => {
    setMessage('');
    const { data, error } = await apiFetch<{ count: number; faces_saved: number }>(API.peopleIntroduce, {
      method: 'POST',
      body: JSON.stringify({ transcript: intro }),
    });
    if (error) {
      setMessage(error);
      return;
    }
    setMessage(`Saved ${data?.count || 0} profile(s), ${data?.faces_saved || 0} face image(s).`);
    fetchProfiles();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>People Memory</h1>
          <p style={{ fontSize: 13, color: '#666688', marginTop: 2 }}>
            Introduce faculty or students so Zoro can remember names, roles, faces, and last-seen time
          </p>
        </div>
        <button className="zoro-btn zoro-btn-secondary" onClick={fetchProfiles}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20 }}>
        <div className="zoro-card" style={{ padding: 18, alignSelf: 'start' }}>
          <h2 style={{ fontSize: 14, color: '#dde0f0', fontWeight: 700, marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
            <Contact size={15} color="var(--zoro-cyan)" /> New Introduction
          </h2>
          <label style={{ fontSize: 11, color: '#666688', fontFamily: 'Space Mono, monospace' }}>SAY OR TYPE INTRODUCTION</label>
          <textarea
            className="zoro-input"
            value={intro}
            onChange={e => setIntro(e.target.value)}
            rows={5}
            style={{ resize: 'vertical', marginTop: 8, marginBottom: 12 }}
          />
          <button className="zoro-btn zoro-btn-primary" onClick={introduce} style={{ width: '100%' }}>
            <Save size={14} /> Save Person
          </button>
          {message && <p style={{ color: message.startsWith('HTTP') ? 'var(--zoro-red)' : 'var(--zoro-green)', fontSize: 12, marginTop: 12 }}>{message}</p>}
        </div>

        <div className="zoro-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: 16, borderBottom: '1px solid var(--zoro-border)', fontSize: 14, fontWeight: 700, color: '#dde0f0' }}>
            Remembered People
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#555577' }}>Loading profiles...</div>
          ) : profiles.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#555577' }}>No people remembered yet.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, padding: 16 }}>
              {profiles.map(profile => (
                <div key={profile.name} style={{ padding: 14, borderRadius: 8, background: 'var(--zoro-surface-3)', border: '1px solid var(--zoro-border)' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{profile.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--zoro-cyan)', marginTop: 4 }}>{profile.role || 'No role saved'}</div>
                  <div style={{ fontSize: 11, color: '#666688', marginTop: 12, lineHeight: 1.7 }}>
                    Seen {profile.times_seen || 0} time(s)<br />
                    First: {profile.first_seen?.replace('T', ' ') || '-'}<br />
                    Last: {profile.last_seen?.replace('T', ' ') || '-'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
