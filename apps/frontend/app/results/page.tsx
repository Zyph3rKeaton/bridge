'use client';
import { useState, useEffect } from 'react';
import { fetchJson } from '../../lib/api';

interface Result {
  id: string;
  board_id: string;
  table_id: string;
  pair_ns: number;
  pair_ew: number;
  contract_level: number;
  strain: string;
  doubled: boolean;
  redoubled: boolean;
  declarer: string;
  tricks_made: number;
  score: number;
  board: {
    number: number;
    dealer: string;
    vulnerability: string;
  };
}

interface PairStanding {
  pair: number;
  mp: number;
  top: number;
}

type EditState = { id: string; field: 'made' | 'down'; value: string } | null;

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eventId, setEventId] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState>(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const events = await fetchJson<any[]>('/api/events');
      if (events.length > 0) {
        const id = events[0].id;
        setEventId(id);
        const resultsData = await fetchJson<Result[]>(`/api/results/events/${id}`);
        setResults(resultsData);
      }
    } catch (_) {
      setError('Failed to load results. Is the backend running on http://localhost:4000?');
    } finally {
      setLoading(false);
    }
  };

  const deleteRow = async (id: string) => {
    const ok = window.confirm('Delete this row?');
    if (!ok) return;
    try {
      await fetchJson(`/api/results/${id}`, { method: 'DELETE' });
      await fetchResults();
    } catch (_) {
      alert('Failed to delete row');
    }
  };

  const getVulnerabilityText = (vul: string) => {
    switch (vul) {
      case 'None': return 'None';
      case 'NS': return 'North-South';
      case 'EW': return 'East-West';
      case 'Both': return 'All';
      default: return vul;
    }
  };

  const getContractText = (r: Result) => {
    const level = r.contract_level;
    const strain = r.strain;
    return `${level} ${strain === 'NT' ? 'NoTrump' : strain === 'C' ? 'Clubs' : strain === 'D' ? 'Diamonds' : strain === 'H' ? 'Hearts' : 'Spades'}`.trim();
  };

  const groupResultsByBoard = () => {
    const grouped: { [key: number]: Result[] } = {};
    results.forEach(result => {
      if (!grouped[result.board.number]) grouped[result.board.number] = [];
      grouped[result.board.number].push(result);
    });
    return grouped;
  };

  const computeBoardMatchpoints = (boardResults: Result[]) => {
    const sortedNS = [...boardResults].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    const n = sortedNS.length;
    const top = 2 * (n - 1);
    const nsMpByPair = new Map<number, number>();
    for (let i = 0; i < sortedNS.length; i++) {
      nsMpByPair.set(sortedNS[i].pair_ns, top - 2 * i);
    }
    const sortedEW = [...boardResults].sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
    const ewMpByPair = new Map<number, number>();
    for (let i = 0; i < sortedEW.length; i++) {
      ewMpByPair.set(sortedEW[i].pair_ew, top - 2 * i);
    }
    return { nsMpByPair, ewMpByPair, top };
  };

  const computeStandings = () => {
    const grouped = groupResultsByBoard();
    const nsTotals = new Map<number, { mp: number; top: number }>();
    const ewTotals = new Map<number, { mp: number; top: number }>();
    for (const key of Object.keys(grouped)) {
      const br = grouped[parseInt(key)];
      const { nsMpByPair, ewMpByPair, top } = computeBoardMatchpoints(br);
      const nsPairsOnBoard = new Set<number>();
      const ewPairsOnBoard = new Set<number>();
      for (const r of br) {
        nsPairsOnBoard.add(r.pair_ns);
        ewPairsOnBoard.add(r.pair_ew);
      }
      for (const p of nsPairsOnBoard) {
        const prev = nsTotals.get(p) || { mp: 0, top: 0 };
        nsTotals.set(p, { mp: prev.mp + (nsMpByPair.get(p) || 0), top: prev.top + top });
      }
      for (const p of ewPairsOnBoard) {
        const prev = ewTotals.get(p) || { mp: 0, top: 0 };
        ewTotals.set(p, { mp: prev.mp + (ewMpByPair.get(p) || 0), top: prev.top + top });
      }
    }
    const nsStandings: PairStanding[] = [...nsTotals.entries()].map(([pair, t]) => ({ pair, mp: t.mp, top: t.top }))
      .sort((a, b) => b.mp - a.mp);
    const ewStandings: PairStanding[] = [...ewTotals.entries()].map(([pair, t]) => ({ pair, mp: t.mp, top: t.top }))
      .sort((a, b) => b.mp - a.mp);
    return { nsStandings, ewStandings };
  };

  const padLeft = (s: string, width: number) => (s.length >= width ? s : ' '.repeat(width - s.length) + s);
  const padRight = (s: string, width: number) => (s.length >= width ? s : s + ' '.repeat(width - s.length));
  const fmt1 = (n: number) => (Number.isFinite(n) ? n.toFixed(1) : '');

  const buildExportText = () => {
    const grouped = groupResultsByBoard();
    const { nsStandings, ewStandings } = computeStandings();

    const lines: string[] = [];
    lines.push('    North-South:    Pair  Points  %Game        East-West:    Pair  Points  %Game');
    lines.push('');

    const rows = Math.max(nsStandings.length, ewStandings.length);
    for (let i = 0; i < rows; i++) {
      const ns = nsStandings[i];
      const ew = ewStandings[i];
      const nsStr = ns ? `${padLeft(String(ns.pair), 6)}  ${padLeft(fmt1(ns.mp), 6)}  ${padLeft(fmt1(ns.top ? (ns.mp / ns.top) * 100 : 0), 5)}%` : padRight('', 21);
      const ewStr = ew ? `${padLeft(String(ew.pair), 6)}  ${padLeft(fmt1(ew.mp), 6)}  ${padLeft(fmt1(ew.top ? (ew.mp / ew.top) * 100 : 0), 5)}%` : '';
      lines.push(`${padRight('', 5)}${nsStr}${padRight('', 23)}${ewStr}`);
    }

    lines.push('');
    // Hands summary
    const totalHands = results.length;
    const nsMade = results.filter(r => r.score > 0).length;
    const nsSet = results.filter(r => r.score < 0).length;
    lines.push(`Hands Played - N/S:${padLeft(String(totalHands), 8)} - ${padLeft(fmt1(totalHands ? (nsMade / totalHands) * 100 : 0), 4)}%`);
    lines.push(`Hands Made - N/S:${padLeft(String(nsMade), 10)} - ${padLeft(fmt1(totalHands ? (nsMade / totalHands) * 100 : 0), 4)}%`);
    lines.push('');
    lines.push(`Hands Set - N/S:${padLeft(String(nsSet), 11)} - ${padLeft(fmt1(totalHands ? (nsSet / totalHands) * 100 : 0), 4)}%`);
    lines.push('');
    const ewMade = nsSet;
    const ewSet = nsMade;
    const ewTotal = totalHands;
    lines.push(`Hands Played - E/W:${padLeft(String(ewTotal), 8)} - ${padLeft(fmt1(ewTotal ? (ewMade / ewTotal) * 100 : 0), 4)}%`);
    lines.push(`Hands Made - E/W:${padLeft(String(ewMade), 10)} - ${padLeft(fmt1(ewTotal ? (ewMade / ewTotal) * 100 : 0), 4)}%`);
    lines.push(`Hands Set - E/W:${padLeft(String(ewSet), 11)} - ${padLeft(fmt1(ewTotal ? (ewSet / ewTotal) * 100 : 0), 4)}%`);
    lines.push('');
    lines.push('');

    // Boards detail
    const boardNumbers = Object.keys(grouped).map(n => parseInt(n)).sort((a, b) => a - b);
    for (const bn of boardNumbers) {
      const br = grouped[bn];
      lines.push(`Board ${bn}   Vulnerability: ${getVulnerabilityText(br[0].board.vulnerability)}`);
      lines.push('');
      lines.push('N/S   E/W   Contract   Dbl/Rdbl  By      Made   Down   N/S   E/W   N/S Pts   E/W Pts');
      lines.push('');
      const { nsMpByPair, ewMpByPair } = computeBoardMatchpoints(br);
      for (const r of br) {
        const contract = padRight(getContractText(r), 11);
        const dbl = padRight(r.redoubled ? 'Rdbl' : r.doubled ? 'Dbld' : '', 9);
        const by = padRight(
          r.declarer === 'N' ? 'North' : r.declarer === 'E' ? 'East' : r.declarer === 'S' ? 'South' : 'West',
          8
        );
        const made = r.tricks_made >= r.contract_level + 6 ? padLeft(String(r.tricks_made), 5) : padLeft('', 5);
        const down = r.tricks_made < r.contract_level + 6 ? padLeft(String(r.contract_level + 6 - r.tricks_made), 5) : padLeft('', 5);
        const nsScore = r.score > 0 ? padLeft(String(r.score), 6) : padLeft('', 6);
        const ewScore = r.score < 0 ? padLeft(String(-r.score), 6) : padLeft('', 6);
        const nsPts = padLeft(fmt1(nsMpByPair.get(r.pair_ns) ?? 0), 7);
        const ewPts = padLeft(fmt1(ewMpByPair.get(r.pair_ew) ?? 0), 7);
        const line = `${padLeft(String(r.pair_ns), 2)}${padLeft('', 4)}${padLeft(String(r.pair_ew), 6)}  ${contract}  ${dbl}${by}${made}${padLeft('', 3)}${down}${padLeft('', 3)}${nsScore}${padLeft('', 3)}${ewScore}${padLeft('', 3)}${nsPts}${padLeft('', 7)}${ewPts}`;
        lines.push(line);
      }
      lines.push('');
      lines.push('');
    }

    return lines.join('\n');
  };

  const onExport = () => {
    const text = buildExportText();
    const a = document.createElement('a');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    a.href = URL.createObjectURL(blob);
    a.download = 'Bridge results.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const onClear = async () => {
    if (!eventId) return;
    const ok = window.confirm('Clear all results for this event?');
    if (!ok) return;
    try {
      await fetchJson(`/api/results/events/${eventId}`, { method: 'DELETE' });
      await fetchResults();
    } catch (e) {
      alert('Failed to clear results.');
    }
  };

  const startEdit = (r: Result, field: 'made' | 'down') => {
    if (field === 'made') {
      const initial = String(Math.max(0, Math.min(13, r.tricks_made)));
      setEdit({ id: r.id, field, value: initial });
    } else {
      const down = Math.max(0, r.contract_level + 6 - r.tricks_made);
      setEdit({ id: r.id, field, value: String(down) });
    }
  };

  const saveEdit = async () => {
    if (!edit) return;
    const r = results.find(x => x.id === edit.id);
    if (!r) { setEdit(null); return; }
    const val = parseInt(edit.value, 10);
    if (Number.isNaN(val)) { setEdit(null); return; }
    let newTricks = r.tricks_made;
    if (edit.field === 'made') {
      newTricks = Math.max(0, Math.min(13, val));
    } else {
      newTricks = Math.max(0, Math.min(13, r.contract_level + 6 - val));
    }
    try {
      await fetchJson(`/api/results/${r.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tricks_made: newTricks })
      });
      await fetchResults();
    } catch (_) {
      alert('Failed to update result');
    } finally {
      setEdit(null);
    }
  };

  const onEditKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') setEdit(null);
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Loading results...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Bridge Results</h1>
        <p className="mt-4" style={{ color: 'var(--error)' }}>{error}</p>
      </div>
    );
  }

  const groupedResults = groupResultsByBoard();
  const { nsStandings, ewStandings } = computeStandings();

  return (
    <div className="p-6 max-w-7xl mx-auto" style={{ color: 'var(--text)' }}>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-3xl font-bold">Bridge Results</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg px-4 py-2 font-semibold focus:outline-none focus:ring-2"
            style={{ backgroundColor: 'var(--error)', color: 'var(--primary-contrast)' }}
          >
            Clear Results
          </button>
          <button
            type="button"
            onClick={onExport}
            className="rounded-lg px-4 py-2 font-semibold focus:outline-none focus:ring-2"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-contrast)' }}
          >
            Export Text
          </button>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Final Standings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-3">North-South</h3>
            <div className="rounded-lg shadow overflow-hidden" style={{ backgroundColor: 'var(--surface)' }}>
              <table className="w-full">
                <thead style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-contrast)' }}>
                  <tr>
                    <th className="px-4 py-2 text-left">Pair</th>
                    <th className="px-4 py-2 text-left">Points</th>
                    <th className="px-4 py-2 text-left">%Game</th>
                  </tr>
                </thead>
                <tbody>
                  {nsStandings.map((s, index) => (
                    <tr key={s.pair} style={{ backgroundColor: index % 2 === 0 ? 'var(--bg)' : 'var(--surface)' }}>
                      <td className="px-4 py-2">{s.pair}</td>
                      <td className="px-4 py-2">{s.mp.toFixed(1)}</td>
                      <td className="px-4 py-2">{s.top ? ((s.mp / s.top) * 100).toFixed(1) : '0.0'}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3">East-West</h3>
            <div className="rounded-lg shadow overflow-hidden" style={{ backgroundColor: 'var(--surface)' }}>
              <table className="w-full">
                <thead style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-contrast)' }}>
                  <tr>
                    <th className="px-4 py-2 text-left">Pair</th>
                    <th className="px-4 py-2 text-left">Points</th>
                    <th className="px-4 py-2 text-left">%Game</th>
                  </tr>
                </thead>
                <tbody>
                  {ewStandings.map((s, index) => (
                    <tr key={s.pair} style={{ backgroundColor: index % 2 === 0 ? 'var(--bg)' : 'var(--surface)' }}>
                      <td className="px-4 py-2">{s.pair}</td>
                      <td className="px-4 py-2">{s.mp.toFixed(1)}</td>
                      <td className="px-4 py-2">{s.top ? ((s.mp / s.top) * 100).toFixed(1) : '0.0'}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Board Results</h2>
        {Object.keys(groupedResults).sort((a, b) => parseInt(a) - parseInt(b)).map(boardNumber => {
          const boardResults = groupedResults[parseInt(boardNumber)];
          const board = boardResults[0].board;
          const { nsMpByPair, ewMpByPair } = computeBoardMatchpoints(boardResults);
          return (
            <div key={boardNumber} className="mb-8">
              <h3 className="text-xl font-semibold mb-3">
                Board {boardNumber} • Vulnerability: {getVulnerabilityText(board.vulnerability)}
              </h3>
              <div className="rounded-lg shadow overflow-hidden" style={{ backgroundColor: 'var(--surface)' }}>
                <table className="w-full text-sm">
                  <thead style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-contrast)' }}>
                    <tr>
                      <th className="px-3 py-2 text-left">N/S</th>
                      <th className="px-3 py-2 text-left">E/W</th>
                      <th className="px-3 py-2 text-left">Contract</th>
                      <th className="px-3 py-2 text-left">Dbl/Rdbl</th>
                      <th className="px-3 py-2 text-left">By</th>
                      <th className="px-3 py-2 text-left">Made</th>
                      <th className="px-3 py-2 text-left">Down</th>
                      <th className="px-3 py-2 text-left">N/S</th>
                      <th className="px-3 py-2 text-left">E/W</th>
                      <th className="px-3 py-2 text-left">N/S Pts</th>
                      <th className="px-3 py-2 text-left">E/W Pts</th>
                      <th className="px-3 py-2 text-right"> </th>
                    </tr>
                  </thead>
                  <tbody>
                    {boardResults.map((result, index) => {
                      const madeShown = result.tricks_made >= result.contract_level + 6 ? String(result.tricks_made) : '';
                      const downShown = result.tricks_made < result.contract_level + 6 ? String(result.contract_level + 6 - result.tricks_made) : '';
                      const isEditingMade = edit && edit.id === result.id && edit.field === 'made';
                      const isEditingDown = edit && edit.id === result.id && edit.field === 'down';
                      const nsRaw = result.score > 0 ? result.score : '';
                      const ewRaw = result.score < 0 ? -result.score : '';
                      return (
                        <tr key={result.id} style={{ backgroundColor: index % 2 === 0 ? 'var(--bg)' : 'var(--surface)' }}>
                          <td className="px-3 py-2">{result.pair_ns}</td>
                          <td className="px-3 py-2">{result.pair_ew}</td>
                          <td className="px-3 py-2">{getContractText(result)}</td>
                          <td className="px-3 py-2">{result.redoubled ? 'Rdbl' : result.doubled ? 'Dbld' : ''}</td>
                          <td className="px-3 py-2">{result.declarer === 'N' ? 'North' : result.declarer === 'E' ? 'East' : result.declarer === 'S' ? 'South' : 'West'}</td>
                          <td className="px-3 py-2" onDoubleClick={() => startEdit(result, 'made')}>
                            {isEditingMade ? (
                              <input aria-label="Edit tricks made" autoFocus type="number" min={0} max={13} className="w-20 rounded px-2 py-1" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }} value={edit?.value || ''} onChange={(e) => setEdit(prev => prev ? { ...prev, value: e.target.value } : prev)} onKeyDown={onEditKey} onBlur={saveEdit} />
                            ) : (
                              <span>{madeShown}</span>
                            )}
                          </td>
                          <td className="px-3 py-2" onDoubleClick={() => startEdit(result, 'down')}>
                            {isEditingDown ? (
                              <input aria-label="Edit tricks down" autoFocus type="number" min={0} max={13} className="w-20 rounded px-2 py-1" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }} value={edit?.value || ''} onChange={(e) => setEdit(prev => prev ? { ...prev, value: e.target.value } : prev)} onKeyDown={onEditKey} onBlur={saveEdit} />
                            ) : (
                              <span>{downShown}</span>
                            )}
                          </td>
                          <td className="px-3 py-2">{nsRaw}</td>
                          <td className="px-3 py-2">{ewRaw}</td>
                          <td className="px-3 py-2">{(nsMpByPair.get(result.pair_ns) ?? 0).toFixed(1)}</td>
                          <td className="px-3 py-2">{(ewMpByPair.get(result.pair_ew) ?? 0).toFixed(1)}</td>
                          <td className="px-3 py-2 text-right align-middle">
                            <button
                              aria-label="Delete row"
                              title="Delete row"
                              onClick={() => deleteRow(result.id)}
                              className="inline-flex items-center justify-center w-9 h-9 text-2xl font-extrabold leading-none hover:opacity-90 focus:outline-none"
                              style={{ backgroundColor: 'transparent', color: 'var(--error)' }}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 