import { useState, useEffect, useRef } from 'react';
import { API, apiFetch } from '../lib/api';
import { MessageSquare, Bot, User, RefreshCw, Search, Clock, ChevronDown, ChevronRight } from 'lucide-react';

interface TranscriptMessage {
  role: 'student' | 'robot';
  text: string;
  timestamp: string;
  topic?: string;
  student_name?: string;
}

interface TranscriptSession {
  id: string;
  date: string;
  start_time: string;
  end_time?: string;
  message_count: number;
  topics: string[];
  student_name: string;
  messages?: TranscriptMessage[];
}

export default function TranscriptsPage() {
  const [sessions, setSessions] = useState<TranscriptSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { fetchSessions(); }, []);

  const fetchSessions = async () => {
    setLoading(true);
    const { data } = await apiFetch<TranscriptSession[]>(API.transcriptList);
    if (data) setSessions(data);
    setLoading(false);
  };

  const fetchMessages = async (session: TranscriptSession) => {
    if (expandedId === session.id) { setExpandedId(null); return; }
    setExpandedId(session.id);
    if (session.messages) return;
    setLoadingMessages(true);
    const { data } = await apiFetch<any[]>(API.transcriptSession(session.id));
    if (data) {
      const mapped = data.map(m => ({
        role: m.role === 'assistant' ? 'robot' : 'student',
        text: m.content,
        timestamp: m.timestamp ? m.timestamp.split('T')[1]?.slice(0, 8) || m.timestamp : '',
        topic: '',
        student_name: session.student_name,
      })) as TranscriptMessage[];
      setSessions(s => s.map(x => x.id === session.id ? { ...x, messages: mapped } : x));
    }
    setLoadingMessages(false);
  };

  const displaySessions = sessions;

  const filteredSessions = displaySessions.filter(s =>
    !searchQuery ||
    s.date.includes(searchQuery) ||
    (s.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.topics.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const allTopics = [...new Set(displaySessions.flatMap(s => s.topics))];
  const students = [...new Set(displaySessions.map(s => s.student_name).filter(Boolean))];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            AI Transcripts
          </h1>
          <p style={{ fontSize: 13, color: '#666688', marginTop: 2 }}>
            Conversations grouped by recognized student, question time, and Zoro response
          </p>
        </div>
        <button className="zoro-btn zoro-btn-secondary" onClick={fetchSessions}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Sessions', value: displaySessions.length },
          { label: 'Total Messages', value: displaySessions.reduce((a, s) => a + s.message_count, 0) },
          { label: 'Topics Covered', value: allTopics.length },
          { label: 'Students', value: students.length },
        ].map(({ label, value }) => (
          <div key={label} className="zoro-card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: '#666688', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Space Mono, monospace', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16, position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#555577' }} />
        <input
          className="zoro-input"
          placeholder="Search by student, date, or topic..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ paddingLeft: 38 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button className={`zoro-btn ${!searchQuery ? 'zoro-btn-primary' : 'zoro-btn-secondary'}`} style={{ padding: '4px 12px', fontSize: 11 }} onClick={() => setSearchQuery('')}>
          All
        </button>
        {allTopics.map(topic => (
          <button key={topic} className={`zoro-btn ${searchQuery === topic ? 'zoro-btn-primary' : 'zoro-btn-secondary'}`} style={{ padding: '4px 12px', fontSize: 11 }} onClick={() => setSearchQuery(topic)}>
            {topic}
          </button>
        ))}
        {students.map(student => (
          <button key={student} className={`zoro-btn ${searchQuery === student ? 'zoro-btn-primary' : 'zoro-btn-secondary'}`} style={{ padding: '4px 12px', fontSize: 11 }} onClick={() => setSearchQuery(student)}>
            {student}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="zoro-card" style={{ padding: 40, textAlign: 'center', color: '#555577' }}>Loading sessions...</div>
      ) : filteredSessions.length === 0 ? (
        <div className="zoro-card" style={{ padding: 40, textAlign: 'center', color: '#555577' }}>
          {searchQuery ? `No sessions found for "${searchQuery}"` : 'No transcripts yet. Ask Zoro a question to get started!'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredSessions.map(session => (
            <div key={session.id} className="zoro-card" style={{ overflow: 'hidden' }}>
              <div
                style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
                onClick={() => fetchMessages(session)}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: expandedId === session.id ? 'var(--zoro-cyan-dim)' : 'var(--zoro-surface-3)',
                  border: `1px solid ${expandedId === session.id ? 'var(--zoro-border-hover)' : 'var(--zoro-border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MessageSquare size={14} color={expandedId === session.id ? 'var(--zoro-cyan)' : '#555577'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#dde0f0' }}>
                      {session.student_name || 'Unknown student'} — {session.date}
                    </span>
                    <span style={{ fontSize: 11, color: '#555577', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={10} /> {session.start_time}{session.end_time ? ` – ${session.end_time}` : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                    {session.topics.map(t => (
                      <span key={t} style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 4,
                        background: 'var(--zoro-surface-3)', color: 'var(--zoro-cyan)',
                        border: '1px solid var(--zoro-border)',
                      }}>{t}</span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, color: '#555577', fontFamily: 'Space Mono, monospace' }}>
                    {session.message_count} msgs
                  </span>
                  {expandedId === session.id ? <ChevronDown size={14} color="#555577" /> : <ChevronRight size={14} color="#555577" />}
                </div>
              </div>

              {expandedId === session.id && (
                <div style={{ borderTop: '1px solid var(--zoro-border)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {loadingMessages ? (
                    <div style={{ textAlign: 'center', color: '#555577', padding: 20 }}>Loading messages...</div>
                  ) : session.messages && session.messages.length > 0 ? (
                    session.messages.map((msg, i) => (
                      <MessageBubble key={i} msg={msg} />
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', color: '#555577', padding: 20 }}>No messages found</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MessageBubble({ msg }: { msg: TranscriptMessage }) {
  const isRobot = msg.role === 'robot';
  return (
    <div className={`transcript-bubble ${isRobot ? 'transcript-robot' : 'transcript-student'}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <div style={{
          width: 20, height: 20, borderRadius: 4,
          background: isRobot ? 'var(--zoro-cyan-dim)' : 'var(--zoro-surface-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isRobot ? <Bot size={11} color="var(--zoro-cyan)" /> : <User size={11} color="#888899" />}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: isRobot ? 'var(--zoro-cyan)' : '#888899', fontFamily: 'Space Mono, monospace' }}>
          {isRobot ? 'ZORO' : msg.student_name || 'STUDENT'}
        </span>
        <span style={{ fontSize: 10, color: '#444466', marginLeft: 'auto', fontFamily: 'Space Mono, monospace' }}>{msg.timestamp}</span>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: isRobot ? '#dde0f0' : '#aaaacc', lineHeight: 1.65 }}>
        {msg.text}
      </p>
    </div>
  );
}
