import { useEffect, useState } from 'react';
import { API, apiFetch } from '../lib/api';
import { Brain, Plus, RefreshCw } from 'lucide-react';

interface WorldItem {
  name: string;
  facts: string[];
  source: string;
  first_seen: string;
  last_seen: string;
  times_seen: number;
}

export default function WorldMemoryPage() {
  const [items, setItems] = useState<WorldItem[]>([]);
  const [name, setName] = useState('');
  const [facts, setFacts] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await apiFetch<{ items: WorldItem[] }>(API.worldMemory);
    if (data) setItems(data.items);
    setLoading(false);
  };

  const teach = async () => {
    setMessage('');
    const { data, error } = await apiFetch<WorldItem>(API.worldTeach, {
      method: 'POST',
      body: JSON.stringify({ name, facts }),
    });
    if (error) {
      setMessage(error);
      return;
    }
    setMessage(`Learned ${data?.name || name}.`);
    setName('');
    setFacts('');
    fetchItems();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>World Memory</h1>
          <p style={{ fontSize: 13, color: '#666688', marginTop: 2 }}>
            Controlled object memory from camera observations and teacher-approved facts
          </p>
        </div>
        <button className="zoro-btn zoro-btn-secondary" onClick={fetchItems}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20 }}>
        <div className="zoro-card" style={{ padding: 18, alignSelf: 'start' }}>
          <h2 style={{ fontSize: 14, color: '#dde0f0', fontWeight: 700, marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
            <Plus size={15} color="var(--zoro-cyan)" /> Teach Object
          </h2>
          <label style={{ fontSize: 11, color: '#666688', fontFamily: 'Space Mono, monospace' }}>NAME</label>
          <input className="zoro-input" value={name} onChange={e => setName(e.target.value)} placeholder="orange, table, projector..." style={{ marginBottom: 10 }} />
          <label style={{ fontSize: 11, color: '#666688', fontFamily: 'Space Mono, monospace' }}>FACTS</label>
          <textarea className="zoro-input" value={facts} onChange={e => setFacts(e.target.value)} rows={5} style={{ resize: 'vertical', marginBottom: 12 }} />
          <button className="zoro-btn zoro-btn-primary" onClick={teach} style={{ width: '100%' }}>
            <Brain size={14} /> Save Memory
          </button>
          {message && <p style={{ marginTop: 12, color: message.startsWith('HTTP') ? 'var(--zoro-red)' : 'var(--zoro-green)', fontSize: 12 }}>{message}</p>}
        </div>

        <div className="zoro-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: 16, borderBottom: '1px solid var(--zoro-border)', fontSize: 14, fontWeight: 700, color: '#dde0f0' }}>
            Learned Objects
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#555577' }}>Loading memories...</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#555577' }}>No world memories yet.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, padding: 16 }}>
              {items.map(item => (
                <div key={item.name} style={{ padding: 14, borderRadius: 8, background: 'var(--zoro-surface-3)', border: '1px solid var(--zoro-border)' }}>
                  <div style={{ fontSize: 15, color: '#fff', fontWeight: 800 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--zoro-cyan)', marginTop: 4, fontFamily: 'Space Mono, monospace' }}>
                    {item.source} - seen {item.times_seen} time(s)
                  </div>
                  <ul style={{ margin: '10px 0 0', paddingLeft: 16, color: '#888899', fontSize: 12, lineHeight: 1.5 }}>
                    {(item.facts || []).slice(0, 3).map(fact => <li key={fact}>{fact}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
