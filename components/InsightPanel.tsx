'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const TOPIC_PROMPTS: Record<string, string> = {
  overview: `Hãy viết tổng quan mệnh cách, theo cấu trúc sau:

**[Định tính mệnh cách]**
Tóm tắt trong một câu cách cục cốt lõi và khí chất của đương số.

**[Luận chính tinh]**
Đặc tính cốt lõi của chính tinh cung Mệnh, dẫn quan điểm của Nghê Hải Hạ.

**【三方四正】**
Phân tích liên động ba cung Tài, Quan, Di và cách cục tổng thể.

**[Đại Hạn hiện tại]**
Xu hướng vận Đại Hạn hiện tại và điều đáng chú ý nhất.

**[Ưu thế và lưu ý]**
Ưu thế bẩm sinh trong lá số, cùng các rủi ro hay bài học cần lưu ý.`,

  love: `Hãy phân tích sâu vận tình cảm hôn nhân, theo cấu trúc sau:

**[Cách cục tình cảm]**
Một câu định tính mệnh cách tình cảm.

**[Phân tích cung Phu Thê]**
Chính tinh, Tứ Hóa cung Phu Thê và luận giải cụ thể theo hệ Nghê Hải Hạ.

**[Liên động Tam phương]**
Ảnh hưởng của các cung liên quan đến tình cảm.

**[Tình cảm trong Đại Hạn hiện tại]**
Xu hướng tình cảm 10 năm hiện tại và các mốc then chốt.

**[Lời khuyên thực tế]**
Lời khuyên tình cảm cụ thể, khả thi.`,

  career: `Hãy phân tích sâu vận sự nghiệp, theo cấu trúc sau:

**[Cách cục sự nghiệp]**
Một câu định tính mệnh cách sự nghiệp: hợp đi làm hay khởi nghiệp.

**[Phân tích cung Quan Lộc]**
Chính tinh, Tứ Hóa cung Quan Lộc và nhận định của thầy Nghê về cấu hình này.

**[Liên động cung Tài Bạch]**
Quan hệ tài lộc và sự nghiệp, phân tích nguồn tiền.

**[Sự nghiệp trong Đại Hạn hiện tại]**
Xu hướng sự nghiệp 10 năm hiện tại.

**[Lời khuyên thực tế]**
Hướng đi, ngành nghề và chiến lược phù hợp.`,

  wealth: `Hãy phân tích sâu tài vận, theo cấu trúc sau:

**[Cách cục tài lộc]**
Một câu định tính kiểu tài lộc: tiền chủ động hay bị động.

**[Phân tích cung Tài Bạch]**
Chính tinh, Tứ Hóa cung Tài Bạch, nguồn và dòng chảy tài chính.

**[Cung Điền Trạch (kho tài)]**
Khả năng tích lũy và vận bất động sản.

**[Tài lộc trong Đại Hạn hiện tại]**
Xu hướng tài lộc hiện tại và điều cần lưu ý.

**[Lời khuyên tài chính]**
Lời khuyên tài chính cụ thể.`,

  health: `Hãy phân tích vận sức khỏe, theo cấu trúc sau:

**【疾厄宫主星】**
Các sao cung Tật Ách và ý nghĩa sức khỏe.

**[Rủi ro chính]**
Kết hợp lý thuyết Tý Ngọ Lưu Chú của Nghê Hải Hạ, phân tích nguy cơ sức khỏe chính và bộ phận cần chú ý.

**[Xu hướng sức khỏe theo Đại Hạn]**
Xu hướng sức khỏe hiện tại và các giai đoạn then chốt.

**[Lời khuyên phòng ngừa]**
Điều cần lưu ý và hướng dưỡng sinh cụ thể.`,

  personality: `Hãy phân tích sâu tính cách, theo cấu trúc sau:

**[Tính cách theo chính tinh cung Mệnh]**
Đặc điểm tính cách cốt lõi theo chính tinh cung Mệnh, dẫn lời thầy Nghê.

**[Tổng hợp tính cách Tam phương]**
Ảnh hưởng của ba cung Tài, Quan, Di đến tính cách, vẽ bức tranh toàn cảnh.

**[Kiểu quan hệ con người]**
Cách tương tác với người khác, phong cách đối nhân xử thế.

**[Ưu thế và bài học cuộc đời]**
Ưu thế bẩm sinh và những bài học cuộc đời cần đối mặt.`,
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

export default function InsightPanel({ chart, selectedPalace, selectedSiHua }: InsightPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string>('overview');
  const messagesRef = useRef<Message[]>([]); // always-current copy for closures
  const loadingRef = useRef(false);
  const autoLoaded = useRef(false);
  const lastPalaceBranch = useRef<number | undefined>(undefined);
  const lastSiHuaKey = useRef<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep refs in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-generate 命格总览 on mount
  useEffect(() => {
    if (autoLoaded.current) return;
    autoLoaded.current = true;
    sendMessage(TOPIC_PROMPTS.overview, true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Inject palace analysis when palace selected
  useEffect(() => {
    if (!selectedPalace || selectedPalace.branch === lastPalaceBranch.current) return;
    lastPalaceBranch.current = selectedPalace.branch;

    const majorStars = selectedPalace.stars.filter(s => s.type === 'major');
    const starDesc = majorStars.length > 0
      ? majorStars.map(s => `${s.name}${s.siHua ? '化' + s.siHua : ''}`).join('、')
      : 'Vô chính diệu (mượn cung đối)';
    const role = PALACE_ROLES[selectedPalace.name] ?? '';

    const prompt = `Hãy phân tích trọng điểm cung [ ${selectedPalace.name} ] (chủ quản: ${role} ), chính tinh của cung là ${starDesc} , theo cấu trúc sau:

**[Định tính cung]**
${selectedPalace.name} — ý nghĩa trong lá số và đánh giá tổng thể cấu hình sao này.

**[Luận chính tinh]**
 — luận chính tinh ở cung này theo hệ Nghê Hải Hạ, dẫn quan điểm cụ thể.

**[Liên động Tam phương tứ chính]**
Ảnh hưởng của các cung Tam phương tứ chính đến cung này.

**[Lời khuyên thực tế]**
Lời khuyên cụ thể dựa trên cung này.`;

    sendMessage(prompt, true);
  }, [selectedPalace]); // eslint-disable-line react-hooks/exhaustive-deps

  // 注入四化飞化分析
  useEffect(() => {
    if (!selectedSiHua) return;
    const key = `${selectedSiHua.starName}-${selectedSiHua.siHua}-${selectedSiHua.view}`;
    if (key === lastSiHuaKey.current) return;
    lastSiHuaKey.current = key;

    // 找出该星所在宫位
    const palaceOfStar = chart.palaces.find(p =>
      p.stars.some(s => s.name === selectedSiHua.starName)
    );
    const palaceName = palaceOfStar?.name ?? 'Cung chưa rõ';
    const viewLabel = selectedSiHua.view === 'daxian' ? '大限' : '流年';

    const prompt = `Hãy phân tích [ ${viewLabel}${selectedSiHua.starName}化${selectedSiHua.siHua} ] — ảnh hưởng phi hóa, theo cấu trúc sau:

**【化${selectedSiHua.siHua} — ý nghĩa cơ bản]**
化${selectedSiHua.siHua} — ý nghĩa cốt lõi trong hệ Nghê Hải Hạ, và ý nghĩa riêng của ${selectedSiHua.starName}化${selectedSiHua.siHua} .

**[Ảnh hưởng cung rơi vào]**
${selectedSiHua.starName}化${selectedSiHua.siHua} rơi vào [ ${palaceName} ], lĩnh vực cung này chủ quản chịu ảnh hưởng ra sao, thầy Nghê luận thế nào.

**[Đường phi hóa Tam phương tứ chính]**
化${selectedSiHua.siHua} nhập ${palaceName} — ảnh hưởng liên động đến Tam phương tứ chính (cung đối, hai cung tam hợp).

**[Ảnh hưởng vận hiện tại]**
Trong ${viewLabel} — ảnh hưởng cụ thể của Hóa ${selectedSiHua.siHua} này đến vận gần đây của đương số.

**[Lời khuyên thực tế]**
Lời khuyên cụ thể, làm được ngay dựa trên Tứ Hóa này.`;

    sendMessage(prompt, true);
  }, [selectedSiHua]); // eslint-disable-line react-hooks/exhaustive-deps

  const streamResponse = async (apiMessages: { role: 'user' | 'assistant'; content: string }[]) => {
    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chart, messages: apiMessages }),
      });
      if (res.status === 404) throw new Error('api-missing');
      if (!res.ok) throw new Error('Yêu cầu thất bại');
      if (!res.body) throw new Error('Không có dữ liệu phản hồi');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const delta = JSON.parse(data).delta?.text ?? '';
            assistantText += delta;
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'assistant', content: assistantText };
              return updated;
            });
          } catch { /* skip */ }
        }
      }
    } catch (e) {
      const missing = e instanceof Error && e.message === 'api-missing';
      setMessages(prev => [...prev, { role: 'assistant', content: missing ? 'Chưa cấu hình AI luận giải. Vui lòng kiểm tra biến môi trường FREELLM_API_KEY trên server.' : 'Luận giải thất bại, vui lòng thử lại sau.' }]);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const sendMessage = (text: string, hidden = false) => {
    if (!text.trim() || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    const userMsg: Message = { role: 'user', content: text, hidden };
    // Capture current messages synchronously via ref (avoids stale closure)
    const apiMessages = [...messagesRef.current, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    streamResponse(apiMessages);
  };

  const handleTopicClick = (topicKey: string) => {
    if (loadingRef.current) return;
    setActiveTopic(topicKey);
    sendMessage(TOPIC_PROMPTS[topicKey], true);
  };

  const handleSend = () => {
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden card-glass">

      {/* ── Topic buttons ── */}
      <div className="flex-shrink-0 px-2 pt-2.5 pb-2" style={{ borderBottom: '1px solid var(--t-border)' }}>
        <div className="grid grid-cols-6 gap-1">
          {TOPICS.map(t => {
            const isActive = activeTopic === t.key;
            return (
              <button
                key={t.key}
                onClick={() => handleTopicClick(t.key)}
                disabled={loading}
                className="py-1.5 text-[10px] font-medium rounded-lg transition-all duration-150 disabled:opacity-40"
                style={{
                  background: isActive ? 'rgba(212,168,67,0.12)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(212,168,67,0.3)' : 'var(--t-border)'}`,
                  color: isActive ? 'var(--t-gold)' : 'var(--t-faint)',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">

        {/* Loading state before first message */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3" style={{ color: 'var(--t-gold)', opacity: 0.1 }}>✦</div>
            <p className="text-[10px] animate-pulse" style={{ color: 'var(--t-faint)' }}>Đang luận giải mệnh cách…</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            if (msg.role === 'user' && msg.hidden) return null;

            if (msg.role === 'user') {
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end"
                >
                  <div
                    className="max-w-[85%] rounded-xl px-3 py-2 text-[11px]"
                    style={{
                      background: 'rgba(212,168,67,0.08)',
                      border: '1px solid rgba(212,168,67,0.18)',
                      color: 'var(--t-gold)',
                    }}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              );
            }

            // Assistant message
            const isLastMsg = i === messages.length - 1;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div
                  className="text-[9px] tracking-widest mb-2 flex items-center gap-1.5"
                  style={{ color: 'var(--t-faint)' }}
                >
                  <span style={{ color: 'var(--t-gold)', opacity: 0.4 }}>✦</span>
                  Luận giải
                </div>
                <AiContent text={msg.content} streaming={loading && isLastMsg} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Input ── */}
      <div className="flex-shrink-0 px-3 pb-3 pt-2" style={{ borderTop: '1px solid var(--t-border)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Hỏi thêm, ví dụ: Năm nay có nên đổi việc không?"
            disabled={loading}
            className="flex-1 rounded-lg px-3 py-2 text-[11px] focus:outline-none transition-colors"
            style={{
              background: 'var(--t-card)',
              border: '1px solid var(--t-border)',
              color: 'var(--t-text)',
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-3 py-2 rounded-lg text-[11px] font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(212,168,67,0.15)',
              border: '1px solid rgba(212,168,67,0.25)',
              color: 'var(--t-gold)',
            }}
          >
            {loading ? '…' : 'Hỏi'}
          </button>
        </div>
      </div>

    </div>
  );
}
