'use client';
import { useEffect, useRef, useState, Suspense } from 'react';
import { API_BASE_URL, fetchJson } from '../../lib/api';
import { useSearchParams } from 'next/navigation';

function ScanClient() {
  const [image, setImage] = useState<string | null>(null);
  const [cropped, setCropped] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [useCamera, setUseCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const searchParams = useSearchParams();
  const selectedBoard = Number(searchParams.get('board') || NaN);

  const gotoBoardEntryWithRow = (r: any) => {
    const url = `/board-entry?board=${encodeURIComponent(r.board_number)}&level=${encodeURIComponent(r.contract_level)}&strain=${encodeURIComponent(r.strain)}&d=${r.doubled ? 1 : 0}&rd=${r.redoubled ? 1 : 0}&dec=${encodeURIComponent(r.declarer)}&tricks=${encodeURIComponent(r.tricks_made)}`;
    window.location.href = url;
  };

  useEffect(() => {
    if (!useCamera) return;
    let stream: MediaStream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (_) {
        setMessage('Camera access denied. You can still upload a photo or use Continuity Camera.');
        setUseCamera(false);
      }
    })();
    return () => { stream && stream.getTracks().forEach(t => t.stop()); };
  }, [useCamera]);

  const handleFile = async (file: File) => {
    setLastFile(file);
    const url = URL.createObjectURL(file);
    setImage(url);
    setCropped(null);
    setRows([]);
    setMessage('Photo ready');
  };

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    setImage(dataUrl);
    setCropped(null);
    setLastFile(null);
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], 'capture.png', { type: 'image/png' });
    setLastFile(file);
    setRows([]);
    setMessage('Photo ready');
  };

  const currentBlob = async (): Promise<Blob | null> => {
    if (lastFile) return lastFile;
    const src = cropped || image;
    if (src && src.startsWith('data:')) {
      const res = await fetch(src);
      return await res.blob();
    }
    if (src) {
      const res = await fetch(src);
      return await res.blob();
    }
    return null;
  };

  const compressImageToJpeg = async (file: File, maxDim = 1600, quality = 0.9): Promise<File> => {
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = dataUrl;
      });
      const { width, height } = img;
      const scale = Math.min(1, maxDim / Math.max(width, height));
      if (scale >= 1) return file;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b || file), 'image/jpeg', quality));
      return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
    } catch {
      return file;
    }
  };

  const smartCrop = async (file: File) => {
    setLoading(true);
    setMessage('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_BASE_URL}/api/results/ocr/corners`, { method: 'POST', body: form });
      if (!res.ok) return; // skip silently
      const json = await res.json();
      const c = json?.corners;
      if (!c) return;
      const imgUrl = URL.createObjectURL(file);
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = imgUrl;
      });
      const xs = [c.top_left.x, c.top_right.x, c.bottom_right.x, c.bottom_left.x];
      const ys = [c.top_left.y, c.top_right.y, c.bottom_right.y, c.bottom_left.y];
      const minX = Math.max(0, Math.min(...xs));
      const maxX = Math.min(img.width, Math.max(...xs));
      const minY = Math.max(0, Math.min(...ys));
      const maxY = Math.min(img.height, Math.max(...ys));
      const w = Math.max(1, Math.round(maxX - minX));
      const h = Math.max(1, Math.round(maxY - minY));
      const cnv = document.createElement('canvas');
      cnv.width = w; cnv.height = h;
      const ctx = cnv.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, minX, minY, w, h, 0, 0, w, h);
      const croppedUrl = cnv.toDataURL('image/jpeg', 0.95);
      setCropped(croppedUrl);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const aiParseWithBlob = async (file: File) => {
    setLoading(true);
    setMessage('');
    try {
      const compressed = await compressImageToJpeg(file, 1600, 0.9);
      let usedFile = compressed;
      let parsedRows: any[] = [];
      const tryParse = async (f: File) => {
        const form = new FormData();
        form.append('file', f);
        const res = await fetch(`${API_BASE_URL}/api/results/ocr/parse`, { method: 'POST', body: form });
        if (!res.ok) throw new Error('OCR parse failed');
        const json = await res.json();
        return json.rows || [];
      };
      parsedRows = await tryParse(compressed);
      if ((!parsedRows || parsedRows.length === 0) && compressed.size !== file.size) {
        usedFile = file;
        parsedRows = await tryParse(file);
      }
      setRows(parsedRows);
      setMessage(`AI parsed ${parsedRows?.length || 0} rows${usedFile === compressed ? ' (compressed)' : ' (hi-res)'}`);
      if (!Number.isNaN(selectedBoard)) {
        const match = (parsedRows || []).find((p: any) => p.board_number === selectedBoard);
        if (match) gotoBoardEntryWithRow(match);
      }
    } catch (e) {
      setMessage('AI parse failed. Open Settings and save the OpenAI key.');
    } finally {
      setLoading(false);
    }
  };

  const aiParse = async () => {
    setLoading(true);
    setMessage('');
    try {
      const blob = await currentBlob();
      if (!blob) { setMessage('No image to parse'); setLoading(false); return; }
      await aiParseWithBlob(new File([blob], 'scan.png', { type: blob.type || 'image/png' }));
    } catch (e) {
      setMessage('AI parse failed. Open Settings and save the OpenAI key.');
    } finally {
      setLoading(false);
    }
  };

  const aiImport = async () => {
    setLoading(true);
    setMessage('');
    try {
      const events = await fetchJson<any[]>('/api/events');
      if (!events.length) { setMessage('No event found'); setLoading(false); return; }
      const eventId = events[0].id;
      const blob = await currentBlob();
      if (!blob) { setMessage('No image to import'); setLoading(false); return; }
      const form = new FormData();
      form.append('file', new File([blob], 'scan.png', { type: blob.type || 'image/png' }));
      const res = await fetch(`${API_BASE_URL}/api/results/events/${eventId}/ocr/import`, { method: 'POST', body: form });
      if (!res.ok) throw new Error('AI import failed');
      const json = await res.json();
      setMessage(`AI imported ${json.imported} rows. View them on the Results page.`);
      if (!Number.isNaN(selectedBoard)) {
        const match = (rows || []).find((p: any) => p.board_number === selectedBoard);
        if (match) gotoBoardEntryWithRow(match);
      }
    } catch (e) {
      setMessage('AI import failed. Open Settings and save the OpenAI key.');
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    setLoading(true);
    setMessage('');
    try {
      const events = await fetchJson<any[]>('/api/events');
      if (!events.length) { setMessage('No event found'); setLoading(false); return; }
      const eventId = events[0].id;

      const data = await fetchJson<{ count: number }>(`/api/results/events/${eventId}/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      setMessage(`Imported ${data.count} rows. View them on the Results page.`);
      if (!Number.isNaN(selectedBoard)) {
        const match = rows.find((p) => p.board_number === selectedBoard);
        if (match) gotoBoardEntryWithRow(match);
      }
    } catch (e) {
      setMessage('Failed to submit to server. Is the backend running on http://localhost:4000?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto" style={{ color: 'var(--text)' }}>
      <h1 className="text-3xl font-bold">Scan Results (Duplicate)</h1>
      <p className="mt-2 text-lg">Upload a clear photo or use the camera. On macOS Finder dialog, choose Import from iPhone to use Continuity Camera.</p>

      <div className="mt-4 flex gap-3 items-center">
        <input type="file" accept="image/*" capture="environment" onChange={(e) => e.target.files && handleFile(e.target.files[0])} />
        <button onClick={() => setUseCamera(v => !v)} className="rounded-lg px-4 py-2" style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-contrast)' }}>
          {useCamera ? 'Close Camera' : 'Use Camera'}
        </button>
        <button onClick={async () => { const blob = await currentBlob(); if (blob) await smartCrop(new File([blob], 'scan.png', { type: blob.type || 'image/png' })); else setMessage('No image to crop'); }} className="rounded-lg px-4 py-2" style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-contrast)' }}>Find Edges</button>
        <button onClick={aiParse} className="rounded-lg px-4 py-2" style={{ backgroundColor: 'var(--accent)', color: 'var(--primary-contrast)' }}>AI Parse</button>
        <button onClick={aiImport} className="rounded-lg px-4 py-2" style={{ backgroundColor: 'var(--accent)', color: 'var(--primary-contrast)' }}>AI Parse & Import</button>
      </div>

      {useCamera && (
        <div className="mt-4 space-y-3">
          <video ref={videoRef} className="w-full rounded" style={{ backgroundColor: 'var(--surface)' }} />
          <div className="flex gap-3">
            <button onClick={captureFrame} className="rounded-lg px-6 py-3" style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-contrast)' }}>Capture</button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {loading && <div className="mt-4">Processing...</div>}
      {message && <div className="mt-4 font-semibold" style={{ color: 'var(--primary)' }}>{message}</div>}

      {(image || cropped) && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {image && (
            <div>
              <div className="mb-2 font-semibold">Original</div>
              <img src={image} alt="scan" className="max-w-full rounded" />
            </div>
          )}
          {cropped && (
            <div>
              <div className="mb-2 font-semibold">Smart-cropped</div>
              <img src={cropped} alt="cropped scan" className="max-w-full rounded" />
            </div>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-6">
          <h2 className="text-2xl font-semibold mb-3">Review Parsed Rows</h2>
          <div className="overflow-x-auto rounded-lg shadow" style={{ backgroundColor: 'var(--surface)' }}>
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-contrast)' }}>
                <tr>
                  <th className="px-3 py-2 text-left">Board #</th>
                  <th className="px-3 py-2 text-left">N/S</th>
                  <th className="px-3 py-2 text-left">E/W</th>
                  <th className="px-3 py-2 text-left">Contract</th>
                  <th className="px-3 py-2 text-left">Dbl</th>
                  <th className="px-3 py-2 text-left">Rdbl</th>
                  <th className="px-3 py-2 text-left">By</th>
                  <th className="px-3 py-2 text-left">Tricks</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? 'var(--bg)' : 'var(--surface)', color: 'var(--text)' }}>
                    <td className="px-3 py-2">{r.board_number}</td>
                    <td className="px-3 py-2">{r.pair_ns}</td>
                    <td className="px-3 py-2">{r.pair_ew}</td>
                    <td className="px-3 py-2">{r.contract_level} {r.strain}</td>
                    <td className="px-3 py-2">{r.doubled ? 'Yes' : ''}</td>
                    <td className="px-3 py-2">{r.redoubled ? 'Yes' : ''}</td>
                    <td className="px-3 py-2">{r.declarer}</td>
                    <td className="px-3 py-2">{r.tricks_made}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-4">
            <button onClick={submit} className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-lg" style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-contrast)' }}>Import Parsed</button>
            <a href="/results" className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-lg" style={{ backgroundColor: 'var(--accent)', color: 'var(--primary-contrast)' }}>View Results</a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <ScanClient />
    </Suspense>
  );
}
