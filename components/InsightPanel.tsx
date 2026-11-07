'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

import type { ZiweiChart, Palace } from '@/lib/ziwei/types';
import type { TimeView } from './TimeNav';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  hidden?: boolean; // don't show user bubble for auto/topic messages
}

interface SelectedSiHua {
  starName: string;
  siHua: string;
  view: TimeView;
}

interface InsightPanelProps {
  chart: ZiweiChart;
  selectedPalace?: Palace | null;
  selectedSiHua?: SelectedSiHua | null;
}

const TOPICS = [
  { key: 'overview',     label: 'Mệnh cách' },
  { key: 'love',        label: 'Tình cảm' },
  { key: 'career',      label: 'Sự nghiệp' },
  { key: 'wealth',      label: 'Tài lộc' },
  { key: 'health',      label: 'Sức khỏe' },
  { key: 'personality', label: 'Tính cách' },
] as const;

/** Prompt chủ đề — ngắn gọn, ưu tiên kết luận. Khung trả lời chung nằm ở SYSTEM_PROMPT (lib/ai/chart-text.ts). */
const TOPIC_PROMPTS: Record<string, string> = {
  overview: `Tổng quan mệnh cách của tôi. Trả lời theo đúng 3 mục:
**Kết luận** — 1–2 câu: tôi là người thế nào, điểm mạnh nhất của lá số.
**Điểm chính** — 3 gạch đầu dòng: cung Mệnh, Tam phương (Tài – Quan – Di), Đại Hạn hiện tại.
**Lời khuyên** — 2 gạch đầu dòng.`,

  love: `Tình cảm, hôn nhân của tôi thế nào? Trả lời theo đúng 3 mục:
**Kết luận** — 1–2 câu về chuyện tình cảm của tôi.
**Điểm chính** — 3 gạch đầu dòng: cung Phu Thê, kiểu người hợp với tôi, giai đoạn thuận lợi/cần lưu ý trong Đại Hạn hiện tại.
**Lời khuyên** — 2 gạch đầu dòng.`,

  career: `Sự nghiệp của tôi thế nào, hợp đi làm hay kinh doanh? Trả lời theo đúng 3 mục:
**Kết luận** — 1–2 câu: hợp hướng nào.
**Điểm chính** — 3 gạch đầu dòng: cung Quan Lộc, ngành nghề phù hợp, vận sự nghiệp trong Đại Hạn hiện tại.
**Lời khuyên** — 2 gạch đầu dòng.`,

  wealth: `Tài lộc của tôi thế nào? Trả lời theo đúng 3 mục:
**Kết luận** — 1–2 câu: kiếm tiền bằng cách nào, giữ tiền tốt không.
**Điểm chính** — 3 gạch đầu dòng: cung Tài Bạch, cung Điền Trạch (tích lũy), tài vận trong Đại Hạn hiện tại.
**Lời khuyên** — 2 gạch đầu dòng.`,

  health: `Sức khỏe của tôi cần lưu ý gì? Trả lời theo đúng 3 mục:
**Kết luận** — 1–2 câu.
**Điểm chính** — 3 gạch đầu dòng: cung Tật Ách, bộ phận/thói quen cần chú ý, giai đoạn cần giữ gìn.
**Lời khuyên** — 2 gạch đầu dòng (dưỡng sinh, khám định kỳ; không chẩn đoán bệnh).`,

  personality: `Tính cách của tôi thế nào? Trả lời theo đúng 3 mục:
**Kết luận** — 1–2 câu tóm tắt con người tôi.
**Điểm chính** — 3 gạch đầu dòng: điểm mạnh, điểm yếu, cách tôi đối xử với người khác.
**Lời khuyên** — 2 gạch đầu dòng.`,
};

const PALACE_ROLES: Record<string, string> = {
  '命宫':   'Bản thân, tính cách, cách cục bẩm sinh',
  '兄弟宫': 'Anh chị em, người hợp tác',
  '夫妻宫': 'Tình cảm, hôn nhân',
  '子女宫': 'Con cái, cấp dưới',
  '财帛宫': 'Nguồn tài lộc, cách kiếm tiền',
  '疾厄宫': 'Sức khỏe, tai nạn',
  '迁移宫': 'Cơ hội khi đi xa, quan hệ xã hội',
  '交友宫': 'Bạn bè, quý nhân, tiểu nhân',
  '官禄宫': 'Thành tựu sự nghiệp, địa vị xã hội',
  '田宅宫': 'Bất động sản, môi trường gia đình',
  '福德宫': 'Đời sống tinh thần, phúc phần nội tâm',
  '父母宫': 'Cha mẹ, giấy tờ hợp đồng',
};

/** Render AI markdown: **【Title】** → gold header, **bold** → strong */
function AiContent({ text, streaming }: { text: string; streaming?: boolean }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        // Tiêu đề mục: **[Tiêu đề]**, **【Tiêu đề】**, **Tiêu đề**, hoặc # / ## / ### Tiêu đề
        const sectionMatch = line.trim().match(/^\*\*[\[【](.+?)[\]】]\*\*:?$/)
          || line.trim().match(/^#{1,4}\s+(.+?)\s*$/)
          || line.trim().match(/^\*\*([^*]{2,80})\*\*:?$/);
        if (sectionMatch) {
          const title = sectionMatch[1].replace(/^\*\*|\*\*$/g, '').replace(/^[\[【]|[\]】]$/g, '');
          return (
            <div key={i} className="pt-3 pb-0.5 first:pt-0">
              <span className="text-[12px] font-semibold tracking-wide" style={{ color: 'var(--t-gold)' }}>
                {title}
              </span>
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} className="h-1" />;
        const bullet = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
        const body = bullet ? bullet[1] : line;
        const parts = body.split(/\*\*(.+?)\*\*/);
        return (
          <div key={i} className={`text-[12px] leading-relaxed${bullet ? ' pl-3 relative' : ''}`} style={{ color: 'var(--t-text2)' }}>
            {bullet && <span className="absolute left-0" style={{ color: 'var(--t-gold)' }}>•</span>}
            {parts.map((part, j) =>
              j % 2 === 0
                ? part
                : <strong key={j} className="font-medium" style={{ color: 'var(--t-text)' }}>{part}</strong>
            )}
          </div>
        );
      })}
      {streaming && (
        <span
          className="inline-block w-1.5 h-3 ml-0.5 animate-pulse rounded-sm align-middle"
          style={{ background: 'var(--t-gold)', opacity: 0.6 }}
        />
      )}
    </div>
  );
}

/**
 * Mỗi tab là một kết quả riêng:
 *  - 6 tab chủ đề: bấm lần đầu thì gọi AI, lần sau hiện lại kết quả đã có (không gọi lại, không cộng dồn).
 *  - Tab "Cung …" / "Tứ Hóa …": tạo khi bấm vào cung hoặc nhãn Tứ Hóa trên bàn lá số; mỗi lần thay nội dung mới.
 *  - Tab "Hỏi đáp": hội thoại tự do, giữ lịch sử riêng của tab này.
 */
type ResultState = { text: string; status: 'loading' | 'done' | 'error' };
type ChatMsg = { role: 'user' | 'assistant'; content: string };

const ERR_MISSING = 'Chưa cấu hình AI luận giải. Vui lòng kiểm tra biến môi trường FREELLM_API_KEY trên server.';
const ERR_FAIL = 'Luận giải thất bại, vui lòng bấm lại tab để thử lại.';

async function streamInterpret(
  chart: ZiweiChart,
  messages: ChatMsg[],
  onText: (full: string) => void,
): Promise<'done' | 'error'> {
  try {
    const res = await fetch('/api/interpret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chart, messages }),
    });
    if (res.status === 404) { onText(ERR_MISSING); return 'error'; }
    if (!res.ok || !res.body) { onText(ERR_FAIL); return 'error'; }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = '';
    let buf = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const delta = JSON.parse(data).delta?.text ?? '';
          if (delta) { text += delta; onText(text); }
        } catch { /* bỏ qua */ }
      }
    }
    if (!text) { onText(ERR_FAIL); return 'error'; }
    return 'done';
  } catch {
    onText(ERR_FAIL);
    return 'error';
  }
}

export default function InsightPanel({ chart, selectedPalace, selectedSiHua }: InsightPanelProps) {
  const [results, setResults] = useState<Record<string, ResultState>>({});
  const [activeKey, setActiveKey] = useState<string>('overview');
  // Tab động: cung / Tứ Hóa đang xem (chỉ giữ 1 cái mới nhất cho gọn)
  const [focusTab, setFocusTab] = useState<{ key: string; label: string } | null>(null);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [input, setInput] = useState('');
  const resultsRef = useRef(results);
  resultsRef.current = results;
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const autoLoaded = useRef(false);
  const lastPalaceBranch = useRef<number | undefined>(undefined);
  const lastSiHuaKey = useRef<string | undefined>(undefined);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const on = () => setIsMobile(mq.matches);
    on(); mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  /** Đưa khung kết quả vào tầm nhìn (mobile) và cuộn nội dung về đầu */
  const reveal = () => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
    if (isMobile) panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /** Chạy 1 prompt độc lập cho 1 tab; force = chạy lại dù đã có kết quả */
  const runTab = (key: string, prompt: string, force = false) => {
    const cur = resultsRef.current[key];
    if (!force && cur && cur.status !== 'error') return; // đã có/đang tải → chỉ hiển thị lại
    setResults(r => ({ ...r, [key]: { text: '', status: 'loading' } }));
    streamInterpret(chart, [{ role: 'user', content: prompt }], text =>
      setResults(r => ({ ...r, [key]: { text, status: 'loading' } })),
    ).then(status => setResults(r => ({ ...r, [key]: { text: r[key]?.text ?? '', status } })));
  };

  const openTopic = (key: string) => {
    setActiveKey(key);
    runTab(key, TOPIC_PROMPTS[key]);
    reveal();
  };

  // Tự chạy "Mệnh cách" lần đầu
  useEffect(() => {
    if (autoLoaded.current) return;
    autoLoaded.current = true;
    runTab('overview', TOPIC_PROMPTS.overview);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Bấm vào cung trên bàn lá số → tab "Cung …"
  useEffect(() => {
    if (!selectedPalace || selectedPalace.branch === lastPalaceBranch.current) return;
    lastPalaceBranch.current = selectedPalace.branch;
    const majorStars = selectedPalace.stars.filter(s => s.type === 'major');
    const starDesc = majorStars.length > 0
      ? majorStars.map(s => `${s.name}${s.siHua ? '化' + s.siHua : ''}`).join('、')
      : 'Vô chính diệu (mượn cung đối)';
    const role = PALACE_ROLES[selectedPalace.name] ?? '';
    const prompt = `Luận cung ${selectedPalace.name} của tôi (chủ về: ${role}; chính tinh: ${starDesc}). Trả lời theo đúng 3 mục:
**Kết luận** — 1–2 câu: cung này tốt hay cần lưu ý, ảnh hưởng gì đến tôi.
**Điểm chính** — 2–3 gạch đầu dòng (sao trong cung, Tam phương tứ chính).
**Lời khuyên** — 1–2 gạch đầu dòng.`;
    const key = `palace:${selectedPalace.branch}`;
    setFocusTab({ key, label: `Cung ${selectedPalace.name.replace(/宫$/, '')}` });
    setActiveKey(key);
    runTab(key, prompt);
    reveal();
  }, [selectedPalace]); // eslint-disable-line react-hooks/exhaustive-deps

  // Bấm nhãn Tứ Hóa (Đại Hạn / Lưu Niên) → tab "Tứ Hóa …"
  useEffect(() => {
    if (!selectedSiHua) return;
    const sk = `${selectedSiHua.starName}-${selectedSiHua.siHua}-${selectedSiHua.view}`;
    if (sk === lastSiHuaKey.current) return;
    lastSiHuaKey.current = sk;
    const palaceOfStar = chart.palaces.find(p => p.stars.some(s => s.name === selectedSiHua.starName));
    const palaceName = palaceOfStar?.name ?? 'Cung chưa rõ';
    const viewLabel = selectedSiHua.view === 'daxian' ? '大限' : '流年';
    const prompt = `${viewLabel}: ${selectedSiHua.starName}化${selectedSiHua.siHua} rơi vào cung ${palaceName}. Điều này ảnh hưởng gì đến tôi? Trả lời theo đúng 3 mục:
**Kết luận** — 1–2 câu.
**Điểm chính** — 2–3 gạch đầu dòng (lĩnh vực bị ảnh hưởng, thời điểm).
**Lời khuyên** — 1–2 gạch đầu dòng.`;
    const key = `sihua:${sk}`;
    setFocusTab({ key, label: `${selectedSiHua.starName}化${selectedSiHua.siHua}` });
    setActiveKey(key);
    runTab(key, prompt);
    reveal();
  }, [selectedSiHua]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hỏi đáp tự do — chỉ tab "Hỏi đáp" giữ hội thoại
  const handleSend = () => {
    const q = input.trim();
    if (!q || chatLoading) return;
    const history: ChatMsg[] = [...chat, { role: 'user', content: q }];
    setChat([...history, { role: 'assistant', content: '' }]);
    setInput('');
    setActiveKey('chat');
    setChatLoading(true);
    if (isMobile) setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    streamInterpret(chart, history.slice(-8), text =>
      setChat(c => { const u = [...c]; u[u.length - 1] = { role: 'assistant', content: text }; return u; }),
    ).finally(() => setChatLoading(false));
  };

  // Hỏi đáp: tự cuộn xuống tin mới trong khung (desktop)
  useEffect(() => {
    if (activeKey === 'chat' && contentRef.current && !isMobile) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [chat, activeKey, isMobile]);

  const tabs: { key: string; label: string }[] = [
    ...TOPICS.map(t => ({ key: t.key as string, label: t.label })),
    ...(focusTab ? [focusTab] : []),
    { key: 'chat', label: chat.length ? `Hỏi đáp (${chat.filter(m => m.role === 'user').length})` : 'Hỏi đáp' },
  ];
  const isTopic = TOPICS.some(t => t.key === activeKey);
  const cur = results[activeKey];

  const inputBar = (
    <div
      className={isMobile ? 'fixed left-0 right-0 bottom-0 z-[70] px-3 pt-2' : 'flex-shrink-0 px-3 pb-3 pt-2'}
      style={isMobile
        ? { background: 'var(--bg-0, #020810)', borderTop: '1px solid rgba(212,168,67,0.35)', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))', boxShadow: '0 -8px 24px rgba(0,0,0,0.45)' }
        : { borderTop: '1px solid var(--t-border)' }}
    >
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={isMobile ? 'Hỏi về lá số của bạn…' : 'Hỏi riêng, ví dụ: Năm nay có nên đổi việc không?'}
          disabled={chatLoading}
          enterKeyHint="send"
          className={`flex-1 min-w-0 rounded-lg px-3 focus:outline-none transition-colors ${isMobile ? 'py-3 text-[16px]' : 'py-2 text-[12px]'}`}
          style={{
            background: isMobile ? 'rgba(255,255,255,0.06)' : 'var(--t-card)',
            border: `1px solid ${isMobile ? 'rgba(212,168,67,0.45)' : 'var(--t-border)'}`,
            color: 'var(--t-text)',
          }}
        />
        <button
          onClick={handleSend}
          disabled={chatLoading || !input.trim()}
          className={`rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isMobile ? 'px-5 text-[15px]' : 'px-4 py-2 text-[12px]'}`}
          style={isMobile
            ? { background: 'linear-gradient(135deg, #b8862e, #e0b553)', color: '#140d02', border: 'none' }
            : { background: 'rgba(212,168,67,0.15)', border: '1px solid rgba(212,168,67,0.3)', color: 'var(--t-gold)' }}
        >
          {chatLoading ? '…' : 'Hỏi'}
        </button>
      </div>
    </div>
  );

  return (
    <div ref={panelRef} className="flex flex-col h-full rounded-xl overflow-hidden card-glass" style={{ scrollMarginTop: 12, border: '1px solid var(--t-border)', background: 'var(--t-card)' }}>

      {/* ── Tabs ── */}
      <div className="flex-shrink-0 px-2 pt-2.5 pb-2" style={{ borderBottom: '1px solid var(--t-border)' }}>
        <div className="flex flex-wrap gap-1.5">
          {tabs.map(t => {
            const isActive = activeKey === t.key;
            const st = results[t.key]?.status;
            return (
              <button
                key={t.key}
                onClick={() => {
                  if (t.key === 'chat' || t.key === focusTab?.key) { setActiveKey(t.key); reveal(); }
                  else openTopic(t.key);
                }}
                className="px-3 py-1.5 text-[12px] lg:text-[11px] whitespace-nowrap font-medium rounded-lg transition-all duration-150"
                style={{
                  background: isActive ? 'rgba(212,168,67,0.14)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(212,168,67,0.45)' : 'var(--t-border)'}`,
                  color: isActive ? 'var(--t-gold)' : 'var(--t-text2)',
                }}
              >
                {t.label}
                {st === 'loading' && <span className="ml-1 animate-pulse">…</span>}
                {st === 'done' && !isActive && t.key !== 'chat' && <span className="ml-1 opacity-60">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Nội dung của tab đang chọn ── */}
      <div ref={contentRef} className="flex-1 overflow-y-auto p-4 min-h-[220px] lg:min-h-0">
        {activeKey !== 'chat' && (
          <>
            <div className="text-[10px] tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--t-faint)' }}>
              <span style={{ color: 'var(--t-gold)', opacity: 0.6 }}>✦</span>
              {tabs.find(t => t.key === activeKey)?.label} · Luận giải AI, mang tính tham khảo
              {cur?.status === 'done' && (
                <button className="ml-auto underline" style={{ color: 'var(--t-faint)' }}
                  onClick={() => {
                    if (isTopic) runTab(activeKey, TOPIC_PROMPTS[activeKey], true);
                    else { lastPalaceBranch.current = undefined; lastSiHuaKey.current = undefined; setResults(r => { const n = { ...r }; delete n[activeKey]; return n; }); }
                  }}>
                  {isTopic ? 'Luận lại' : 'Xóa'}
                </button>
              )}
            </div>
            {!cur || (cur.status === 'loading' && !cur.text) ? (
              <p className="text-[12px] animate-pulse py-6 text-center" style={{ color: 'var(--t-faint)' }}>Đang luận giải…</p>
            ) : (
              <AiContent text={cur.text} streaming={cur.status === 'loading'} />
            )}
          </>
        )}

        {activeKey === 'chat' && (
          chat.length === 0 ? (
            <div className="text-center py-8 text-[12px] leading-relaxed" style={{ color: 'var(--t-faint)' }}>
              Gõ câu hỏi riêng của bạn ở ô bên dưới.<br />Ví dụ: “Năm 2027 có nên mua nhà không?”
            </div>
          ) : (
            <div className="space-y-4">
              {chat.map((m, i) => m.role === 'user' ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] rounded-xl px-3 py-2 text-[12px]"
                    style={{ background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.25)', color: 'var(--t-gold)' }}>
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={i}>
                  {m.content
                    ? <AiContent text={m.content} streaming={chatLoading && i === chat.length - 1} />
                    : <p className="text-[12px] animate-pulse" style={{ color: 'var(--t-faint)' }}>Đang trả lời…</p>}
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* ── Ô hỏi (desktop: trong khung; mobile: dính đáy màn hình) ── */}
      {isMobile ? (
        typeof document !== 'undefined' ? createPortal(inputBar, document.body) : null
      ) : inputBar}
    </div>
  );
}
