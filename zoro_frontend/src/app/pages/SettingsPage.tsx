import { useState, useEffect } from 'react';
import { API, apiFetch } from '../lib/api';
import { Save, RefreshCw, Shield, Server, Mic, Wifi, AlertTriangle, Check } from 'lucide-react';

interface SystemInfo {
  pi_ip: string;
  ngrok_url: string;
  uptime: string;
  mic_device: string;
  camera_device: string;
  python_version: string;
}

export default function SettingsPage() {
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);
  const [robotUrl, setRobotUrl] = useState(import.meta.env.VITE_ROBOT_URL || 'http://10.205.108.215:8001');
  const [saved, setSaved] = useState(false);
  const [voiceAction, setVoiceAction] = useState<null | 'starting' | 'stopping'>(null);
  const [restarting, setRestarting] = useState(false);

  useEffect(() => { fetchSysInfo(); }, []);

  const fetchSysInfo = async () => {
    const { data } = await apiFetch<SystemInfo>(`${API.base}/system/info`);
    if (data) setSysInfo(data);
  };

  const handleSaveUrl = () => {
    localStorage.setItem('zoro_robot_url', robotUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleVoiceStart = async () => {
    setVoiceAction('starting');
    await apiFetch(API.voiceStart, { method: 'POST' });
    setTimeout(() => setVoiceAction(null), 3000);
  };

  const handleVoiceStop = async () => {
    setVoiceAction('stopping');
    await apiFetch(API.voiceStop, { method: 'POST' });
    setTimeout(() => setVoiceAction(null), 2000);
  };

  const handleRestart = async () => {
    setRestarting(true);
    await apiFetch(`${API.base}/system/restart`, { method: 'POST' });
    setTimeout(() => setRestarting(false), 5000);
  };

  // Mock system info for demo
  const displayInfo = sysInfo || {
    pi_ip: '10.205.108.68',
    ngrok_url: 'https://whooping-chafe-pucker.ngrok-free.dev',
    uptime: '2h 34m',
    mic_device: 'hw:2,0 (USB Audio Device)',
    camera_device: '/dev/video0 (FINGERS 720)',
    python_version: 'Python 3.13',
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
          Configuration
        </h1>
        <p style={{ fontSize: 13, color: '#666688', marginTop: 2 }}>
          Robot connection settings, voice agent controls, and system info
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Connection config */}
        <div>
          <div className="zoro-card" style={{ padding: 18, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Wifi size={15} color="var(--zoro-cyan)" />
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#dde0f0' }}>Robot Connection</h2>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#888899', display: 'block', marginBottom: 6 }}>
                Backend URL (Laptop port 8001 or ngrok)
              </label>
              <input
                className="zoro-input"
                value={robotUrl}
                onChange={e => setRobotUrl(e.target.value)}
                placeholder="http://10.205.108.215:8001"
              />
              <p style={{ fontSize: 11, color: '#555577', marginTop: 4 }}>
                Change this if your IP or ngrok URL changes
              </p>
            </div>

            <button className="zoro-btn zoro-btn-primary" onClick={handleSaveUrl}>
              {saved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save URL</>}
            </button>
          </div>

          {/* API Keys warning */}
          <div className="zoro-card" style={{ padding: 16, borderColor: 'rgba(251,191,36,0.25)', background: 'rgba(251,191,36,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <AlertTriangle size={15} color="var(--zoro-amber)" />
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--zoro-amber)' }}>API Keys — Action Required</h2>
            </div>
            <p style={{ fontSize: 12, color: '#b8a070', lineHeight: 1.7, marginBottom: 10 }}>
              Your OpenAI and Deepgram API keys were exposed in a previous chat. Regenerate them immediately:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer"
                className="zoro-btn zoro-btn-secondary"
                style={{ justifyContent: 'flex-start', fontSize: 12, textDecoration: 'none' }}>
                <Shield size={13} color="var(--zoro-amber)" /> Regenerate OpenAI Key →
              </a>
              <a href="https://console.deepgram.com" target="_blank" rel="noreferrer"
                className="zoro-btn zoro-btn-secondary"
                style={{ justifyContent: 'flex-start', fontSize: 12, textDecoration: 'none' }}>
                <Shield size={13} color="var(--zoro-amber)" /> Regenerate Deepgram Key →
              </a>
            </div>
            <p style={{ fontSize: 11, color: '#888877', marginTop: 10 }}>
              After regenerating, update <span style={{ fontFamily: 'Space Mono, monospace', color: 'var(--zoro-cyan)' }}>~/robot/.env</span> on the Pi
            </p>
          </div>
        </div>

        {/* System info + voice control */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Voice agent */}
          <div className="zoro-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Mic size={15} color="var(--zoro-cyan)" />
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#dde0f0' }}>Voice Agent</h2>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <button
                className="zoro-btn zoro-btn-secondary"
                style={{ flex: 1 }}
                onClick={handleVoiceStart}
                disabled={voiceAction !== null}
              >
                {voiceAction === 'starting' ? 'Starting…' : '▶ Start Voice'}
              </button>
              <button
                className="zoro-btn zoro-btn-danger"
                style={{ flex: 1 }}
                onClick={handleVoiceStop}
                disabled={voiceAction !== null}
              >
                {voiceAction === 'stopping' ? 'Stopping…' : '■ Stop Voice'}
              </button>
            </div>

            <div className="zoro-card" style={{ padding: 12 }}>
              <h3 style={{ fontSize: 11, color: '#555577', fontFamily: 'Space Mono, monospace', marginBottom: 8 }}>TROUBLESHOOT</h3>
              {[
                { cmd: 'sudo killall arecord', desc: 'Kill stale mic processes' },
                { cmd: 'sudo fuser /dev/snd/pcmC2D0c', desc: 'Check what holds the mic' },
                { cmd: 'python3 robot/voice_agent.py', desc: 'Test voice agent directly' },
              ].map(({ cmd, desc }) => (
                <div key={cmd} style={{ marginBottom: 8 }}>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'var(--zoro-cyan)', background: 'var(--zoro-surface-3)', padding: '4px 8px', borderRadius: 4 }}>
                    {cmd}
                  </div>
                  <div style={{ fontSize: 11, color: '#555577', marginTop: 2 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* System info */}
          <div className="zoro-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Server size={15} color="var(--zoro-cyan)" />
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#dde0f0' }}>System Info</h2>
              </div>
              <button className="zoro-btn zoro-btn-secondary" style={{ padding: '5px 10px' }} onClick={fetchSysInfo}>
                <RefreshCw size={12} />
              </button>
            </div>

            {[
              { label: 'Pi IP', value: displayInfo.pi_ip },
              { label: 'ngrok URL', value: displayInfo.ngrok_url, truncate: true },
              { label: 'Uptime', value: displayInfo.uptime },
              { label: 'Microphone', value: displayInfo.mic_device },
              { label: 'Camera', value: displayInfo.camera_device },
              { label: 'Python', value: displayInfo.python_version },
            ].map(({ label, value, truncate }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: 12, color: '#888899', flexShrink: 0 }}>{label}</span>
                <span style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--zoro-cyan)',
                  fontFamily: 'Space Mono, monospace', textAlign: 'right',
                  overflow: truncate ? 'hidden' : undefined,
                  textOverflow: truncate ? 'ellipsis' : undefined,
                  whiteSpace: truncate ? 'nowrap' : undefined,
                  maxWidth: truncate ? 180 : undefined,
                }}>{value}</span>
              </div>
            ))}

            <div style={{ borderTop: '1px solid var(--zoro-border)', paddingTop: 12, marginTop: 4 }}>
              <button
                className="zoro-btn zoro-btn-danger"
                style={{ width: '100%' }}
                onClick={handleRestart}
                disabled={restarting}
              >
                {restarting ? 'Restarting…' : '↺ Restart Robot Service'}
              </button>
            </div>
          </div>

          {/* ngrok tip */}
          <div className="zoro-card" style={{ padding: 14 }}>
            <h3 style={{ fontSize: 11, color: '#666688', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>ngrok Tip</h3>
            <p style={{ fontSize: 12, color: '#888899', lineHeight: 1.7 }}>
              Get a free static ngrok domain so the URL doesn't change on restart:
            </p>
            <a href="https://dashboard.ngrok.com/domains" target="_blank" rel="noreferrer"
              className="zoro-btn zoro-btn-secondary"
              style={{ marginTop: 8, fontSize: 12, textDecoration: 'none', display: 'inline-flex' }}>
              dashboard.ngrok.com/domains →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
