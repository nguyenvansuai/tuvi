'use client';
import { motion } from 'framer-motion';
import type { Palace, Star } from '@/lib/ziwei/types';
import { STEMS, BRANCHES } from '@/lib/ziwei/constants';
import clsx from 'clsx';

interface PalaceCellProps {
  palace: Palace;
  onClick?: () => void;
  onStarClick?: (star: Star) => void;
  isSelected?: boolean;
  isSanFang?: boolean;
  delay?: number;
  /** Tứ Hóa chồng lớp: tên sao → loại hóa ('禄'/'权'/'科'/'忌') */
  overlayStarSiHua?: Record<string, string>;
  /** Nhãn lớp chồng: '年' (Lưu Niên) hoặc '限' (Đại Hạn) */
  overlayLabel?: string;
  onSiHuaClick?: (starName: string, siHua: string) => void;
  /** Hiện cả tạp tinh (mặc định chỉ hiện sao quan trọng cho dễ nhìn) */
  showMinor?: boolean;
}

/** Lục cát + Lộc Mã — luôn hiện */
const KEY_LUCKY = new Set(['左辅', '右弼', '文昌', '文曲', '天魁', '天钺', '禄存', '天马']);
/** Lục sát — luôn hiện */
const KEY_SHA = new Set(['擎羊', '陀罗', '火星', '铃星', '地空', '地劫']);

const SIHUA_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  '禄': { bg: '#059669', fg: '#fff', label: 'Lộc' },
  '权': { bg: '#2563eb', fg: '#fff', label: 'Quyền' },
  '科': { bg: '#ca8a04', fg: '#fff', label: 'Khoa' },
  '忌': { bg: '#dc2626', fg: '#fff', label: 'Kỵ' },
};

/** Viết tắt độ sáng theo cách lá số Việt hay dùng */
const BRIGHT_ABBR: Record<string, string> = {
  '庙': 'M', '旺': 'V', '得': 'Đ', '利': 'L', '平': 'B', '不': 'Bt', '闲': 'N', '陷': 'H', '地': 'Đ',
};
const BRIGHT_FULL: Record<string, string> = {
  '庙': 'Miếu', '旺': 'Vượng', '得': 'Đắc', '利': 'Lợi', '平': 'Bình', '不': 'Bất', '闲': 'Nhàn', '陷': 'Hãm', '地': 'Địa',
};

function SiHuaBadge({ siHua, overlay, label, onClick }: {
  siHua: string; overlay?: boolean; label?: string; onClick?: (e: React.MouseEvent) => void;
}) {
  const st = SIHUA_STYLE[siHua];
  if (!st) return null;
  return (
    <span
      onClick={onClick}
      title={overlay ? `Hóa ${st.label} (${label === '限' ? 'Đại Hạn' : 'Lưu Niên'})` : `Hóa ${st.label}`}
      className={clsx('inline-flex items-center rounded px-1 ml-1 text-[9px] font-semibold leading-[14px] flex-shrink-0', onClick && 'cursor-pointer')}
      style={overlay
        ? { border: `1px dashed ${st.bg}`, color: st.bg, background: 'transparent' }
        : { background: st.bg, color: st.fg }}
    >
      {overlay && <span className="mr-0.5 opacity-80">{label === '限' ? 'ĐH' : 'LN'}</span>}
      {st.label}
    </span>
  );
}

function StarChip({ s, color, overlaySiHua, overlayLabel, onSiHuaClick }: {
  s: Star; color: string; overlaySiHua?: string; overlayLabel?: string;
  onSiHuaClick?: (starName: string, siHua: string) => void;
}) {
  return (
    <span className="inline-flex items-center text-[10.5px] leading-[16px] whitespace-nowrap" style={{ color }}>
      {s.name}
      {s.siHua && <SiHuaBadge siHua={s.siHua} />}
      {overlaySiHua && (
        <SiHuaBadge siHua={overlaySiHua} overlay label={overlayLabel}
          onClick={e => { e.stopPropagation(); onSiHuaClick?.(s.name, overlaySiHua); }} />
      )}
    </span>
  );
}

export default function PalaceCell({
  palace, onClick, onStarClick, isSelected, isSanFang, delay = 0,
  overlayStarSiHua, overlayLabel, onSiHuaClick, showMinor,
}: PalaceCellProps) {
  const { branch, stem, name, stars, daXianAge, isCurrentDaXian, isMingGong, isShenGong } = palace;

  const majorStars = stars.filter(s => s.type === 'major');
  const luckyStars = stars.filter(s => KEY_LUCKY.has(s.name) || (showMinor && s.type === 'lucky'));
  const shaStars = stars.filter(s => KEY_SHA.has(s.name) || (showMinor && s.type === 'sha'));
  const minorStars = showMinor ? stars.filter(s => s.type === 'minor') : [];
  // Sao phụ đang ẩn nhưng có Tứ Hóa → vẫn phải hiện
  const hiddenWithHua = showMinor ? [] : stars.filter(s => s.type !== 'major' && !KEY_LUCKY.has(s.name) && !KEY_SHA.has(s.name) && s.siHua);

  const accent = isMingGong ? '#f59e0b' : isShenGong ? '#38bdf8' : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      onClick={onClick}
      className="relative flex flex-col px-1.5 sm:px-2 py-1.5 cursor-pointer transition-colors duration-200 h-full"
      style={{
        minHeight: 118,
        background: isSelected
          ? 'rgba(37,99,235,0.16)'
          : isSanFang
          ? 'rgba(37,99,235,0.08)'
          : isCurrentDaXian
          ? 'rgba(147,51,234,0.08)'
          : 'var(--t-bg)',
        boxShadow: isSelected
          ? 'inset 0 0 0 2px rgba(37,99,235,0.75)'
          : isSanFang
          ? 'inset 0 0 0 1px rgba(37,99,235,0.45)'
          : isCurrentDaXian
          ? 'inset 0 0 0 1px rgba(147,51,234,0.55)'
          : 'none',
      }}
    >
      {/* Tiêu đề: tên cung + nhãn Thân; dòng 2: can chi · tuổi Đại Hạn */}
      <div className="flex items-center flex-wrap gap-1">
        <span className="text-[12px] font-semibold leading-tight"
          style={{ color: accent ?? 'var(--t-text)' }}>
          {name.replace(/宫$/, '')}
        </span>
        {isShenGong && <span className="text-[9px] font-bold px-1 rounded leading-[14px]" style={{ background: '#38bdf8', color: '#04121c' }}>身</span>}
      </div>
      <div className="flex items-center justify-between flex-wrap gap-x-1 text-[9.5px] leading-tight mb-1" style={{ color: 'var(--t-faint)' }}>
        <span className="whitespace-nowrap">{`${STEMS[stem]}${BRANCHES[branch]}`}</span>
        {daXianAge && (
          <span className={clsx('tabular-nums whitespace-nowrap', isCurrentDaXian && 'font-semibold')}
            style={isCurrentDaXian ? { color: '#c084fc' } : undefined}>
            {daXianAge[0]}–{daXianAge[1]}
          </span>
        )}
      </div>

      {/* Chính tinh */}
      <div className="flex flex-col gap-0.5">
        {majorStars.length === 0 && (
          <span className="text-[11px] italic leading-tight" style={{ color: 'var(--t-faint)' }}>
            空宫
            {palace.borrowedStars && palace.borrowedStars.length > 0 && (
              <span className="not-italic text-[10px] opacity-80">{' '}(mượn {palace.borrowedStars.join(', ')})</span>
            )}
          </span>
        )}
        {majorStars.map(star => {
          const overlaySiHua = overlayStarSiHua?.[star.name];
          const b = star.brightnessRaw;
          return (
            <div key={star.name} className="flex items-center flex-wrap"
              onClick={e => { e.stopPropagation(); onStarClick?.(star); }}>
              <span className={clsx(
                'text-[13px] sm:text-[14px] leading-tight font-bold cursor-pointer hover:brightness-125',
                star.brightness === 'bright' ? 'text-amber-300' : star.brightness === 'dim' ? 'text-amber-600' : 'text-amber-400',
              )}>
                {star.name}
              </span>
              {b && BRIGHT_ABBR[b] && (
                <span className="text-[9.5px] ml-0.5 font-medium whitespace-nowrap" title={BRIGHT_FULL[b]}
                  style={{ color: 'var(--t-faint)' }}>({BRIGHT_ABBR[b]})</span>
              )}
              {star.siHua && <SiHuaBadge siHua={star.siHua} />}
              {overlaySiHua && (
                <SiHuaBadge siHua={overlaySiHua} overlay label={overlayLabel}
                  onClick={e => { e.stopPropagation(); onSiHuaClick?.(star.name, overlaySiHua); }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Sao phụ: cát (xanh) / sát (đỏ) / tạp tinh (xám) */}
      <div className="mt-auto pt-1 flex flex-col gap-0.5">
        {(luckyStars.length > 0 || hiddenWithHua.length > 0) && (
          <div className="flex flex-wrap gap-x-1.5">
            {[...luckyStars, ...hiddenWithHua].map(s => (
              <StarChip key={s.name} s={s} color="#38bdf8" overlaySiHua={overlayStarSiHua?.[s.name]}
                overlayLabel={overlayLabel} onSiHuaClick={onSiHuaClick} />
            ))}
          </div>
        )}
        {shaStars.length > 0 && (
          <div className="flex flex-wrap gap-x-1.5">
            {shaStars.map(s => (
              <StarChip key={s.name} s={s} color="#f87171" overlaySiHua={overlayStarSiHua?.[s.name]}
                overlayLabel={overlayLabel} onSiHuaClick={onSiHuaClick} />
            ))}
          </div>
        )}
        {minorStars.length > 0 && (
          <div className="flex flex-wrap gap-x-1.5">
            {minorStars.map(s => (
              <span key={s.name} className="text-[9.5px] leading-[14px] whitespace-nowrap" style={{ color: 'var(--t-faint)' }}>{s.name}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
