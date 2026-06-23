import { useState, useEffect, useRef } from 'react';
import { API, apiFetch } from '../lib/api';
import { Upload, Trash2, BookOpen, FileText, RefreshCw, Brain, Check, Play, Square, Timer } from 'lucide-react';

interface SyllabusFile {
  id: string;
  filename: string;
  subject: string;
  size_kb: number;
  uploaded_at: string;
  status: 'processing' | 'ready' | 'error';
  chunks?: number;
}

interface LessonPlan {
  subject: string;
  duration_minutes: number;
  break_count: number;
  break_minutes?: number;
  teaching_minutes?: number;
  source_files: string[];
  topics: string[];
  greeting?: string;
  schedule: Array<{
    type: string;
    minutes: number;
    title: string;
    activity: string;
    objective?: string;
    teaching_points?: string[];
  }>;
}

export default function SyllabusPage() {
  const [files, setFiles] = useState<SyllabusFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [subject, setSubject] = useState('');
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [ragStatus, setRagStatus] = useState<{ built: boolean; chunk_count: number; sources: string[]; built_at?: string } | null>(null);
  const [lessonSubject, setLessonSubject] = useState('');
  const [duration, setDuration] = useState(45);
  const [breakCount, setBreakCount] = useState(2);
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [lessonBusy, setLessonBusy] = useState<null | 'build' | 'start' | 'stop'>(null);
  const [lessonMsg, setLessonMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchFiles(); fetchRagStatus(); }, []);

  const fetchFiles = async () => {
    setLoading(true);
    const { data } = await apiFetch<SyllabusFile[]>(API.syllabusList);
    if (data) setFiles(data);
    fetchRagStatus();
    setLoading(false);
  };

  const fetchRagStatus = async () => {
    const { data } = await apiFetch<{ built: boolean; chunk_count: number; sources: string[]; built_at?: string }>(API.ragStatus);
    if (data) setRagStatus(data);
  };

  const rebuildRag = async () => {
    setUploadMsg(null);
    const { data, error } = await apiFetch<{ chunk_count: number; sources: string[] }>(API.ragReindex, { method: 'POST' });
    if (error) {
      setUploadMsg({ type: 'error', text: error });
      return;
    }
    setUploadMsg({ type: 'success', text: `Knowledge index rebuilt with ${data?.chunk_count || 0} chunks.` });
    fetchRagStatus();
  };

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setUploadMsg(null);

    const formData = new FormData();
    Array.from(fileList).forEach(f => formData.append('files', f));
    if (subject) formData.append('subject', subject);

    try {
      const res = await fetch(API.syllabusUpload, { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setUploadMsg({ type: 'success', text: `${data.uploaded || fileList.length} file(s) uploaded. AI is processing…` });
        setSubject('');
        setTimeout(fetchFiles, 1500);
      } else {
        setUploadMsg({ type: 'error', text: 'Upload failed. Is the robot online?' });
      }
    } catch {
      setUploadMsg({ type: 'error', text: 'Network error.' });
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await apiFetch(API.syllabusDelete(id), { method: 'DELETE' });
    if (!error) {
      setFiles(f => f.filter(x => x.id !== id));
    }
  };

  const buildLessonPlan = async (start = false) => {
    setLessonBusy(start ? 'start' : 'build');
    setLessonMsg(null);
    const payload = {
      subject: lessonSubject || subject || files[0]?.subject || files[0]?.filename || '',
      duration_minutes: duration,
      break_count: breakCount,
    };
    const { data, error } = await apiFetch<LessonPlan>(start ? API.lessonStart : API.lessonPlan, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (error) {
      setLessonMsg({ type: 'error', text: error });
    } else if (data) {
      setPlan(data);
      setLessonMsg({ type: 'success', text: start ? 'Teaching started. Zoro will greet the class and begin the lesson.' : 'Teaching plan built.' });
    }
    setLessonBusy(null);
  };

  const stopLesson = async () => {
    setLessonBusy('stop');
    const { error } = await apiFetch(API.lessonStop, { method: 'POST' });
    setLessonMsg(error ? { type: 'error', text: error } : { type: 'success', text: 'Teaching stopped and progress saved.' });
    setLessonBusy(null);
  };

  const displayFiles = files;

  const statusColor = { ready: 'var(--zoro-green)', processing: 'var(--zoro-amber)', error: 'var(--zoro-red)' };
  const statusLabel = { ready: 'Ready', processing: 'Processing…', error: 'Error' };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
          Syllabus & AI Training
        </h1>
        <p style={{ fontSize: 13, color: '#666688', marginTop: 2 }}>
          Upload curriculum documents · Zoro uses these to answer student questions in class
        </p>
      </div>

      {/* How it works banner */}
      <div className="zoro-card" style={{ padding: '14px 18px', marginBottom: 20, borderColor: 'var(--zoro-border-hover)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Brain size={16} color="var(--zoro-cyan)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#dde0f0' }}>How AI Training Works</span>
        </div>
        <p style={{ fontSize: 12, color: '#888899', lineHeight: 1.7 }}>
          Upload PDFs, TXT, or DOCX files of your syllabus, textbook chapters, or lesson notes.
          Zoro's AI (GPT-4o-mini via OpenAI) will use this context when answering student questions.
          Files are chunked and stored for retrieval-augmented generation (RAG).
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20 }}>
        {/* Upload panel */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#dde0f0', marginBottom: 12 }}>Upload Documents</h2>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: '#888899', display: 'block', marginBottom: 6 }}>Subject / Topic (optional)</label>
            <input
              className="zoro-input"
              placeholder="e.g. Computer Science, Physics…"
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
          </div>

          <div
            className={`drop-zone ${dragOver ? 'dragging' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
            style={{ marginBottom: 12 }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.docx,.doc,.pptx,.zip,.scorm,.html,.htm,.xml,.md,.csv"
              style={{ display: 'none' }}
              onChange={e => handleUpload(e.target.files)}
            />
            <Upload size={28} color={dragOver ? 'var(--zoro-cyan)' : '#555577'} style={{ margin: '0 auto 10px' }} />
            <p style={{ fontSize: 14, color: dragOver ? 'var(--zoro-cyan)' : '#888899', fontWeight: 600 }}>
              Drop syllabus files here
            </p>
            <p style={{ fontSize: 11, color: '#555577', marginTop: 4 }}>
              PDF · TXT · DOCX supported
            </p>
            {uploading && (
              <p style={{ fontSize: 12, color: 'var(--zoro-cyan)', marginTop: 10, fontFamily: 'Space Mono, monospace' }}>
                Uploading & processing…
              </p>
            )}
          </div>

          {uploadMsg && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12,
              background: uploadMsg.type === 'success' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
              border: `1px solid ${uploadMsg.type === 'success' ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`,
              color: uploadMsg.type === 'success' ? 'var(--zoro-green)' : 'var(--zoro-red)',
            }}>
              {uploadMsg.text}
            </div>
          )}

          {/* AI stats */}
          <div className="zoro-card" style={{ padding: 14 }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: '#666688', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Space Mono, monospace', marginBottom: 12 }}>
              AI Knowledge Base
            </h3>
            {[
              { label: 'Documents', value: displayFiles.filter(f => f.status === 'ready').length },
              { label: 'RAG Chunks', value: ragStatus?.chunk_count || 0 },
              { label: 'Indexed', value: ragStatus?.built ? 'Ready' : 'Not built' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#888899' }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--zoro-cyan)', fontFamily: 'Space Mono, monospace' }}>{value}</span>
              </div>
            ))}
            <button className="zoro-btn zoro-btn-secondary" onClick={rebuildRag} style={{ width: '100%', marginTop: 8 }}>
              <RefreshCw size={14} /> Rebuild Knowledge Index
            </button>
          </div>

          <div className="zoro-card" style={{ padding: 14, marginTop: 14 }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: '#666688', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Space Mono, monospace', marginBottom: 12 }}>
              Teaching Module
            </h3>
            <label style={{ fontSize: 11, color: '#666688', fontFamily: 'Space Mono, monospace' }}>SUBJECT / FILE</label>
            <input
              className="zoro-input"
              placeholder="Use uploaded subject or filename"
              value={lessonSubject}
              onChange={e => setLessonSubject(e.target.value)}
              style={{ marginBottom: 10 }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: '#666688', fontFamily: 'Space Mono, monospace' }}>CLASS MINUTES</label>
                <input className="zoro-input" type="number" min={10} max={180} value={duration} onChange={e => setDuration(Number(e.target.value))} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#666688', fontFamily: 'Space Mono, monospace' }}>5-MIN BREAKS</label>
                <input className="zoro-input" type="number" min={0} max={4} value={breakCount} onChange={e => setBreakCount(Number(e.target.value))} />
              </div>
            </div>
            <p style={{ fontSize: 11, color: '#77778f', lineHeight: 1.5, marginBottom: 10 }}>
              Example: 45 minutes with 2 breaks creates three teaching parts and two 5-minute pauses.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <button className="zoro-btn zoro-btn-secondary" disabled={!!lessonBusy} onClick={() => buildLessonPlan(false)}>
                <Timer size={14} /> {lessonBusy === 'build' ? 'Building...' : 'Build Plan'}
              </button>
              <button className="zoro-btn zoro-btn-primary" disabled={!!lessonBusy} onClick={() => buildLessonPlan(true)}>
                <Play size={14} /> {lessonBusy === 'start' ? 'Starting...' : 'Start'}
              </button>
            </div>
            <button className="zoro-btn zoro-btn-danger" disabled={!!lessonBusy} onClick={stopLesson} style={{ width: '100%' }}>
              <Square size={14} /> {lessonBusy === 'stop' ? 'Stopping...' : 'Stop Teaching'}
            </button>
            {lessonMsg && (
              <div style={{
                padding: '9px 12px', borderRadius: 8, fontSize: 12, marginTop: 10,
                background: lessonMsg.type === 'success' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                border: `1px solid ${lessonMsg.type === 'success' ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`,
                color: lessonMsg.type === 'success' ? 'var(--zoro-green)' : 'var(--zoro-red)',
              }}>
                {lessonMsg.text}
              </div>
            )}
          </div>
        </div>

        {/* File list */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#dde0f0' }}>Uploaded Documents</h2>
            <button className="zoro-btn zoro-btn-secondary" onClick={fetchFiles}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="zoro-card" style={{ padding: 30, textAlign: 'center', color: '#555577' }}>Loading…</div>
          ) : displayFiles.length === 0 ? (
            <div className="zoro-card" style={{ padding: 40, textAlign: 'center', color: '#555577' }}>
              <BookOpen size={32} style={{ margin: '0 auto 10px' }} />
              <p>No documents uploaded yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {displayFiles.map(file => (
                <div key={file.id} className="zoro-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: 'var(--zoro-cyan-dim)', border: '1px solid var(--zoro-border-hover)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FileText size={16} color="var(--zoro-cyan)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#dde0f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.filename}
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
                      {file.subject && <span style={{ fontSize: 11, color: 'var(--zoro-cyan)' }}>{file.subject}</span>}
                      <span style={{ fontSize: 11, color: '#555577', fontFamily: 'Space Mono, monospace' }}>{file.size_kb}KB</span>
                      {file.chunks && <span style={{ fontSize: 11, color: '#555577' }}>{file.chunks} chunks</span>}
                      <span style={{ fontSize: 11, color: '#555577' }}>{file.uploaded_at}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: statusColor[file.status], fontFamily: 'Space Mono, monospace' }}>
                      {file.status === 'ready' && <Check size={11} style={{ display: 'inline', marginRight: 4 }} />}
                      {statusLabel[file.status]}
                    </span>
                    <button
                      className="zoro-btn zoro-btn-danger"
                      style={{ padding: '5px 8px' }}
                      onClick={() => handleDelete(file.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {plan && (
            <div className="zoro-card" style={{ padding: 18, marginTop: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#dde0f0', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Timer size={16} color="var(--zoro-cyan)" /> {plan.subject} - {plan.duration_minutes} minutes
              </h2>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--zoro-cyan)', fontFamily: 'Space Mono, monospace' }}>{plan.teaching_minutes || plan.duration_minutes} teaching min</span>
                <span style={{ fontSize: 11, color: 'var(--zoro-amber)', fontFamily: 'Space Mono, monospace' }}>{plan.break_count} breaks</span>
                <span style={{ fontSize: 11, color: '#666688' }}>{plan.source_files.length || 0} source file(s)</span>
              </div>
              {plan.greeting && (
                <p style={{ fontSize: 12, color: '#888899', lineHeight: 1.6, padding: 10, borderRadius: 8, background: 'var(--zoro-surface-3)', border: '1px solid var(--zoro-border)', marginBottom: 12 }}>
                  {plan.greeting}
                </p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {plan.schedule.map((item, index) => (
                  <div key={`${item.type}-${index}`} style={{ padding: 12, borderRadius: 8, background: 'var(--zoro-surface-3)', border: '1px solid var(--zoro-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 5 }}>
                      <strong style={{ color: item.type === 'break' ? 'var(--zoro-amber)' : 'var(--zoro-cyan)', fontSize: 12 }}>
                        {index + 1}. {item.title}
                      </strong>
                      <span style={{ color: '#666688', fontSize: 11, fontFamily: 'Space Mono, monospace', whiteSpace: 'nowrap' }}>{item.minutes} min</span>
                    </div>
                    <p style={{ color: '#aaaac0', fontSize: 12, lineHeight: 1.5 }}>{item.objective || item.activity}</p>
                    {item.teaching_points && item.teaching_points.length > 0 && (
                      <p style={{ color: '#77778f', fontSize: 11, lineHeight: 1.5, marginTop: 5 }}>
                        {item.teaching_points.slice(0, 2).join(' ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
