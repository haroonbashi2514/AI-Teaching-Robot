import { useState, useEffect } from 'react';
import { API, apiFetch } from '../lib/api';
import { Plus, Play, Trash2, Mic, Volume2, Edit3, Check, X } from 'lucide-react';

interface SpeechConfig {
  id: string;
  name: string;
  trigger_phrase: string;
  content: string;
  voice: string;
  created_at: string;
  last_triggered?: string;
}

const PRESET_VOICES = ['aura-asteria-en', 'aura-luna-en', 'aura-stella-en', 'aura-athena-en', 'aura-zeus-en'];

export default function SpeechPage() {
  const [speeches, setSpeeches] = useState<SpeechConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    trigger_phrase: '',
    content: '',
    voice: 'aura-asteria-en',
  });

  useEffect(() => { fetchSpeeches(); }, []);

  const fetchSpeeches = async () => {
    setLoading(true);
    const { data } = await apiFetch<SpeechConfig[]>(API.speechList);
    if (data) setSpeeches(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.name || !form.content) return;
    setCreating(true);
    const isEdit = editingId !== null && editingId !== 'new';
    const { data } = await apiFetch<SpeechConfig>(isEdit ? API.speechUpdate(editingId) : API.speechCreate, {
      method: isEdit ? 'PUT' : 'POST',
      body: JSON.stringify(form),
    });
    if (data) {
      setSpeeches(s => isEdit ? s.map(item => item.id === data.id ? data : item) : [data, ...s]);
      setForm({ name: '', trigger_phrase: '', content: '', voice: 'aura-asteria-en' });
      setEditingId(null);
    }
    setCreating(false);
  };

  const startEdit = (speech: SpeechConfig) => {
    setForm({
      name: speech.name,
      trigger_phrase: speech.trigger_phrase || '',
      content: speech.content,
      voice: speech.voice || 'aura-asteria-en',
    });
    setEditingId(speech.id);
  };

  const handleTrigger = async (id: string) => {
    setTriggering(id);
    await apiFetch(API.speechTrigger(id), { method: 'POST' });
    setTimeout(() => setTriggering(null), 3000);
  };

  const handleDelete = async (id: string) => {
    await apiFetch(API.speechDelete(id), { method: 'DELETE' });
    setSpeeches(s => s.filter(x => x.id !== id));
  };

  // Mock data for demo
  const displaySpeeches = speeches.length > 0 ? speeches : [
    {
      id: '1', name: 'Seminar Welcome', trigger_phrase: 'welcome speech',
      content: 'Good morning everyone! Welcome to our seminar. I am Zoro, your AI teaching assistant. Today we will be exploring fascinating topics together. Please feel free to ask me any questions during the session.',
      voice: 'aura-asteria-en', created_at: '2026-04-20',
    },
    {
      id: '2', name: 'Class Start', trigger_phrase: 'start class',
      content: 'Attention students! Class is about to begin. Please take your seats and ensure your attendance has been registered. Today\'s topic has been loaded into my knowledge base.',
      voice: 'aura-luna-en', created_at: '2026-04-21',
    },
    {
      id: '3', name: 'Break Announcement', trigger_phrase: 'break time',
      content: 'We will now take a 10-minute break. Please be back on time. If you have any questions, you can continue asking me during the break.',
      voice: 'aura-asteria-en', created_at: '2026-04-22', last_triggered: '2026-04-27',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Special Speech
          </h1>
          <p style={{ fontSize: 13, color: '#666688', marginTop: 2 }}>
            Configure announcements, welcome speeches, and automated messages for Zoro
          </p>
        </div>
        <button className="zoro-btn zoro-btn-primary" onClick={() => setEditingId('new')}>
          <Plus size={14} /> New Speech
        </button>
      </div>

      {/* Create form */}
      {editingId && (
        <div className="zoro-card" style={{ padding: 20, marginBottom: 24, borderColor: 'var(--zoro-border-hover)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#dde0f0', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Edit3 size={14} color="var(--zoro-cyan)" /> {editingId === 'new' ? 'Create New Speech' : 'Edit Speech'}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: '#888899', display: 'block', marginBottom: 6 }}>Speech Name *</label>
              <input className="zoro-input" placeholder="e.g. Seminar Welcome" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#888899', display: 'block', marginBottom: 6 }}>
                Voice Trigger Phrase
                <span style={{ fontSize: 11, color: '#555577', marginLeft: 6 }}>(optional — say this to Zoro)</span>
              </label>
              <input className="zoro-input" placeholder="e.g. give welcome speech" value={form.trigger_phrase} onChange={e => setForm(f => ({ ...f, trigger_phrase: e.target.value }))} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: '#888899', display: 'block', marginBottom: 6 }}>Speech Content *</label>
            <textarea
              className="zoro-input"
              rows={5}
              placeholder="Type the speech content Zoro will say…"
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              style={{ resize: 'vertical' }}
            />
            <div style={{ fontSize: 11, color: '#555577', marginTop: 4 }}>
              {form.content.length} characters · ~{Math.ceil(form.content.split(' ').length / 130)} min read
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: '#888899', display: 'block', marginBottom: 8 }}>Deepgram Voice</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PRESET_VOICES.map(v => (
                <button
                  key={v}
                  className={`zoro-btn ${form.voice === v ? 'zoro-btn-primary' : 'zoro-btn-secondary'}`}
                  style={{ padding: '6px 12px', fontSize: 12 }}
                  onClick={() => setForm(f => ({ ...f, voice: v }))}
                >
                  {v.replace('aura-', '').replace('-en', '')}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="zoro-btn zoro-btn-primary" onClick={handleCreate} disabled={creating || !form.name || !form.content}>
              {creating ? 'Saving…' : <><Check size={14} /> {editingId === 'new' ? 'Create Speech' : 'Save Changes'}</>}
            </button>
            <button className="zoro-btn zoro-btn-secondary" onClick={() => setEditingId(null)}>
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Speech list */}
      {loading ? (
        <div className="zoro-card" style={{ padding: 40, textAlign: 'center', color: '#555577' }}>Loading speeches…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {displaySpeeches.map(speech => (
            <div key={speech.id} className="zoro-card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 6,
                      background: 'var(--zoro-cyan-dim)', border: '1px solid var(--zoro-border-hover)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Mic size={14} color="var(--zoro-cyan)" />
                    </div>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{speech.name}</span>
                      {speech.trigger_phrase && (
                        <span style={{
                          marginLeft: 10, fontSize: 11, color: 'var(--zoro-cyan)',
                          fontFamily: 'Space Mono, monospace',
                          background: 'var(--zoro-cyan-dim)', padding: '2px 8px', borderRadius: 4,
                        }}>
                          "{speech.trigger_phrase}"
                        </span>
                      )}
                    </div>
                  </div>

                  <p style={{
                    fontSize: 13, color: '#888899', lineHeight: 1.65,
                    background: 'var(--zoro-surface-3)', padding: '10px 14px', borderRadius: 8,
                    marginBottom: 10, fontStyle: 'italic',
                  }}>
                    "{speech.content.slice(0, 200)}{speech.content.length > 200 ? '…' : ''}"
                  </p>

                  <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#555577' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Volume2 size={11} color="#555577" />
                      {speech.voice.replace('aura-', '').replace('-en', '')}
                    </span>
                    <span>Created {speech.created_at}</span>
                    {speech.last_triggered && <span style={{ color: 'var(--zoro-green)' }}>Last used: {speech.last_triggered}</span>}
                    <span>{speech.content.split(' ').length} words</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    className="zoro-btn zoro-btn-secondary"
                    style={{ padding: '8px 10px' }}
                    onClick={() => startEdit(speech)}
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    className={`zoro-btn ${triggering === speech.id ? 'zoro-btn-primary' : 'zoro-btn-secondary'}`}
                    style={{ gap: 6 }}
                    onClick={() => handleTrigger(speech.id)}
                    disabled={triggering === speech.id}
                  >
                    {triggering === speech.id ? (
                      <>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--zoro-green)', animation: 'pulse-dot 0.8s infinite', display: 'inline-block' }} />
                        Speaking…
                      </>
                    ) : (
                      <><Play size={13} /> Trigger</>
                    )}
                  </button>
                  <button className="zoro-btn zoro-btn-danger" style={{ padding: '8px 10px' }} onClick={() => handleDelete(speech.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {displaySpeeches.length === 0 && (
            <div className="zoro-card" style={{ padding: 40, textAlign: 'center', color: '#555577' }}>
              <Mic size={32} style={{ margin: '0 auto 10px' }} />
              <p>No speeches configured. Click "New Speech" to create one.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
