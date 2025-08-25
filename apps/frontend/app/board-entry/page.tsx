'use client';
import { useState, useEffect } from 'react';
import { fetchJson } from '../../lib/api';

export default function BoardEntryPage() {
  const [level, setLevel] = useState<number | null>(null);
  const [suit, setSuit] = useState<'C' | 'D' | 'H' | 'S' | 'NT' | null>(null);
  const [doubled, setDoubled] = useState(false);
  const [redoubled, setRedoubled] = useState(false);
  const [declarer, setDeclarer] = useState<'N' | 'E' | 'S' | 'W' | null>(null);
  const [tricks, setTricks] = useState<number | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [boardId, setBoardId] = useState<string>('');
  const [tableId, setTableId] = useState<string>('');
  const [boardData, setBoardData] = useState<{ number: number; dealer: string; vulnerability: string } | null>(null);
  const [boards, setBoards] = useState<Array<{ id: string; number: number; dealer: string; vulnerability: string }>>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const desiredBoard = Number(params.get('board') || NaN);
        const events = await fetchJson<any[]>('/api/events');
        if (events.length > 0) {
          const eventId = events[0].id;
          const boards = await fetchJson<Array<{ id: string; number: number; dealer: string; vulnerability: string }>>(`/api/events/${eventId}/boards`);
          if (boards && boards.length > 0) {
            setBoards(boards);
            let board = boards[0];
            if (!Number.isNaN(desiredBoard)) {
              const found = boards.find(b => b.number === desiredBoard);
              if (found) board = found;
            }
            setBoardId(board.id);
            setBoardData(board);
            setTableId('table-1');

            const qLevel = params.get('level');
            const qStrain = params.get('strain') as any;
            const qD = params.get('d');
            const qRd = params.get('rd');
            const qDec = params.get('dec') as any;
            const qTricks = params.get('tricks');
            if (qLevel) setLevel(Number(qLevel));
            if (qStrain && ['C','D','H','S','NT'].includes(qStrain)) setSuit(qStrain);
            if (qD) setDoubled(qD === '1');
            if (qRd) setRedoubled(qRd === '1');
            if (qDec && ['N','E','S','W'].includes(qDec)) setDeclarer(qDec);
            if (qTricks) setTricks(Number(qTricks));
          }
        }
      } catch (_) {
        setError('Failed to load boards. Is the backend running on http://localhost:4000?');
      }
    })();
  }, []);

  useEffect(() => {
    if (level && suit && declarer && tricks !== null && boardId) {
      void (async () => {
        try {
          const data = await fetchJson<{ score: number }>('/api/results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              board_id: boardId,
              table_id: tableId,
              pair_ns: 1,
              pair_ew: 2,
              contract_level: level,
              strain: suit,
              doubled,
              redoubled,
              declarer,
              tricks_made: tricks,
            }),
          });
          setScore(data.score);
        } catch (_) {}
      })();
    }
  }, [level, suit, declarer, tricks, boardId, tableId, doubled, redoubled]);

  const handleBoardChange = (boardId: string) => {
    const board = boards.find(b => b.id === boardId);
    if (board) {
      setBoardId(boardId);
      setBoardData(board);
      setLevel(null);
      setSuit(null);
      setDoubled(false);
      setRedoubled(false);
      setDeclarer(null);
      setTricks(null);
      setScore(null);
    }
  };

  const calculateScore = async () => {
    if (!level || !suit || !declarer || tricks === null || !boardId) return;
    setError('');
    try {
      const data = await fetchJson<{ score: number }>('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board_id: boardId,
          table_id: tableId,
          pair_ns: 1,
          pair_ew: 2,
          contract_level: level,
          strain: suit,
          doubled,
          redoubled,
          declarer,
          tricks_made: tricks,
        }),
      });
      setScore(data.score);
    } catch (e) {
      setError('Failed to calculate score. Is the backend running on http://localhost:4000?');
    }
  };

  const saveAndNext = async () => {
    if (!level || !suit || !declarer || tricks === null || !boardId) return;
    setError('');
    try {
      await fetchJson('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board_id: boardId,
          table_id: tableId,
          pair_ns: 1,
          pair_ew: 2,
          contract_level: level,
          strain: suit,
          doubled,
          redoubled,
          declarer,
          tricks_made: tricks,
        }),
      });
      // Move to next board in the list
      const idx = boards.findIndex(b => b.id === boardId);
      const next = boards[(idx + 1) % boards.length];
      handleBoardChange(next.id);
    } catch (e) {
      setError('Failed to save. Is the backend running on http://localhost:4000?');
    }
  };

  const contract = level && suit ? `${level}${suit}${redoubled ? 'xx' : doubled ? 'x' : ''}` : '';
  const result = tricks !== null ? `${tricks} tricks` : '';

  const isDeclarerVulnerable = boardData && declarer ? 
    (boardData.vulnerability === 'Both' || 
     (boardData.vulnerability === 'NS' && (declarer === 'N' || declarer === 'S')) ||
     (boardData.vulnerability === 'EW' && (declarer === 'E' || declarer === 'W'))) : false;

  const getVulnerabilityText = (vul: string) => {
    switch (vul) {
      case 'None': return 'Neither vulnerable';
      case 'NS': return 'N/S vulnerable';
      case 'EW': return 'E/W vulnerable';
      case 'Both': return 'Both vulnerable';
      default: return 'Unknown vulnerability';
    }
  };

  return (
    <div className="p-6" style={{ color: 'var(--text)' }}>
      {error && <div className="mb-4" style={{ color: 'var(--error)' }}>{error}</div>}
      {boardData ? (
        <div>
          <h1 className="text-2xl font-semibold">
            Board {boardData.number} • {boardData.dealer} deals • {getVulnerabilityText(boardData.vulnerability)}
          </h1>

          <div className="mt-4">
            <label className="block text-lg mb-2">Select Board:</label>
            <select 
              value={boardId} 
              onChange={(e) => handleBoardChange(e.target.value)}
              className="rounded-lg px-4 py-2 text-lg focus:outline-none"
              style={{ minHeight: 48, backgroundColor: 'var(--surface)', color: 'var(--text)', border: '2px solid var(--text)' }}
            >
              {boards.map((board) => (
                <option key={board.id} value={board.id} style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}>
                  Board {board.number} - {board.dealer} deals - {getVulnerabilityText(board.vulnerability)}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <h1 className="text-2xl font-semibold">Loading board...</h1>
      )}

      <div className="mt-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Contract</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-lg mb-2">Level</label>
              <div className="grid grid-cols-3 gap-3">
                {[1,2,3,4,5,6,7].map((num) => (
                  <button
                    key={num}
                    onClick={() => setLevel(num)}
                    className="rounded-lg text-white focus:outline-none"
                    style={{ minHeight: 56, fontSize: '24px', backgroundColor: 'var(--primary)', border: level === num ? '3px solid var(--success)' : '3px solid transparent' }}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-lg mb-2">Suit</label>
              <div className="grid grid-cols-5 gap-3">
                {(['C', 'D', 'H', 'S', 'NT'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSuit(s)}
                    className={`rounded-lg focus:outline-none ${s === 'D' || s === 'H' ? 'text-red-600' : 'text-white'}`}
                    style={{ minHeight: 56, fontSize: '24px', backgroundColor: 'var(--surface)', color: s === 'D' || s === 'H' ? undefined : 'var(--text)', border: suit === s ? '3px solid var(--success)' : '2px solid var(--text)' }}
                  >
                    {s === 'C' ? '♣' : s === 'D' ? '♦' : s === 'H' ? '♥' : s === 'S' ? '♠' : 'NT'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setDoubled(!doubled)}
                className="inline-flex items-center justify-center rounded-lg px-6 py-4 text-white text-xl"
                style={{ minHeight: 56, backgroundColor: doubled ? 'var(--primary)' : 'var(--accent)', color: 'var(--primary-contrast)', border: doubled ? '3px solid var(--success)' : '3px solid transparent' }}
              >
                Doubled
              </button>
              <button
                onClick={() => setRedoubled(!redoubled)}
                className="inline-flex items-center justify-center rounded-lg px-6 py-4 text-white text-xl"
                style={{ minHeight: 56, backgroundColor: redoubled ? 'var(--primary)' : 'var(--accent)', color: 'var(--primary-contrast)', border: redoubled ? '3px solid var(--success)' : '3px solid transparent' }}
              >
                Redoubled
              </button>
            </div>

            <div>
              <label className="block text-lg mb-2">Declarer</label>
              <div className="grid grid-cols-4 gap-3">
                {(['N', 'E', 'S', 'W'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDeclarer(d)}
                    className="inline-flex items-center justify-center rounded-lg px-6 py-4 text-white text-xl"
                    style={{ minHeight: 56, backgroundColor: declarer === d ? 'var(--primary)' : 'var(--accent)', color: 'var(--primary-contrast)', border: declarer === d ? '3px solid var(--success)' : '3px solid transparent' }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Result</h2>
          <div>
            <label className="block text-lg mb-2">Tricks made</label>
            <div className="grid grid-cols-3 gap-3">
              {[0,1,2,3,4,5,6,7,8,9,10,11,12,13].map((num) => (
                <button
                  key={num}
                  onClick={() => setTricks(num)}
                  className="rounded-lg text-white focus:outline-none"
                  style={{ minHeight: 56, fontSize: '24px', backgroundColor: 'var(--primary)', border: tricks === num ? '3px solid var(--success)' : '3px solid transparent' }}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {(contract || result || score !== null) && (
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
            {contract && <div className="text-lg"><span className="font-semibold">Contract:</span> {contract}</div>}
            {result && <div className="text-lg mt-2"><span className="font-semibold">Result:</span> {result}</div>}
            {declarer && boardData && (
              <div className="text-lg mt-2">
                <span className="font-semibold">Declarer:</span> {declarer} 
                {isDeclarerVulnerable && (
                  <span className="ml-2 font-semibold" style={{ color: 'var(--error)' }}>(Vulnerable)</span>
                )}
              </div>
            )}
            {score !== null && (
              <div className="text-xl font-bold mt-2" style={{ color: score >= 0 ? 'var(--success)' : 'var(--error)' }}>
                {score >= 0 ? '+' : ''}{score}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={calculateScore}
            disabled={!level || !suit || !declarer || tricks === null || !boardId}
            className="inline-flex items-center justify-center rounded-lg px-6 py-4 text-white text-xl disabled:opacity-50"
            style={{ minHeight: 56, backgroundColor: 'var(--primary)' }}
          >
            Calculate Score
          </button>
          <button
            onClick={saveAndNext}
            disabled={!level || !suit || !declarer || tricks === null || !boardId}
            className="inline-flex items-center justify-center rounded-lg px-6 py-4 text-white text-xl disabled:opacity-50"
            style={{ minHeight: 56, backgroundColor: 'var(--accent)', color: 'var(--primary-contrast)', border: '3px solid var(--success)' }}
          >
            Save & Next Board
          </button>
        </div>
      </div>
    </div>
  );
} 