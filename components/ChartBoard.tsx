'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ZiweiChart, Palace, Star } from '@/lib/ziwei/types';
import { BRANCHES, STEMS } from '@/lib/ziwei/constants';
import PalaceCell from './PalaceCell';
import TimeNav, { type TimeView, getYearStemIndex, buildSiHuaOverlay } from './TimeNav';

interface ChartBoardProps {
  chart: ZiweiChart;
  onStarSelect?: (star: Star, palace: Palace) => void;
  onPalaceSelect?: (palace: Palace) => void;
  onSiHuaClick?: (starName: string, siHua: string, view: TimeView) => void;
}

const BRANCH_GRID_POS: Record<number, [number, number]> = {
  5: [1, 1], 6: [1, 2], 7: [1, 3], 8: [1, 4],
  4: [2, 1], 9: [2, 4],
  3: [3, 1], 10: [3, 4],
  2: [4, 1], 1: [4, 2], 0: [4, 3], 11: [4, 4],
};

// 每个地支宫位在网格中的中心坐标（百分比）
const BRANCH_SVG_POS: Record<number, [number, number]> = {
  5: [12.5, 12.5], 6: [37.5, 12.5], 7: [62.5, 12.5], 8: [87.5, 12.5],
  4: [12.5, 37.5],                                      9: [87.5, 37.5],
  3: [12.5, 62.5],                                     10: [87.5, 62.5],
  2: [12.5, 87.5], 1: [37.5, 87.5], 0: [62.5, 87.5], 11: [87.5, 87.5],
};

// 绕盘面顺时针排列（用于三方四正四边形排序）
const CLOCKWISE_INDEX: Record<number, number> = {
  5: 0, 6: 1, 7: 2, 8: 3,
  9: 4, 10: 5,
  11: 6, 0: 7, 1: 8, 2: 9,
  3: 10, 4: 11,
};

function sortClockwise(branches: number[]): number[] {
  return [...branches].sort((a, b) => CLOCKWISE_INDEX[a] - CLOCKWISE_INDEX[b]);
}

/** 三方四正：本宫 + 对宫 + 两个三合宫 */
function getSanFangSiZheng(branch: number): [number, number, number, number] {
  return [
    branch,
    (branch + 6) % 12,   // 对宫
    (branch + 4) % 12,   // 三合1
    (branch + 8) % 12,   // 三合2
  ];
}

const ANIMATION_ORDER = [5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4];

export default function ChartBoard({ chart, onStarSelect, onPalaceSelect, onSiHuaClick }: ChartBoardProps) {
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [timeView, setTimeView] = useState<TimeView>('mingpan');
  const [liunianYear, setLiunianYear] = useState<number>(new Date().getFullYear());
  const [showMinor, setShowMinor] = useState(false);

  const palaceMap: Record<number, Palace> = {};
  chart.palaces.forEach(p => { palaceMap[p.branch] = p; });

  // 计算当前叠加四化数据（大限或流年）
  const currentDx = chart.daXians[chart.currentDaXianIndex];
  const overlayData: Record<string, string> = (() => {
    if (timeView === 'daxian' && currentDx) {
      const dxPalace = chart.palaces.find(p => p.branch === currentDx.palaceBranch);
      if (dxPalace) return buildSiHuaOverlay(dxPalace.stem);
    }
    if (timeView === 'liunian') {
      return buildSiHuaOverlay(getYearStemIndex(liunianYear));
    }
    return {};
  })();
  const overlayLabel = timeView === 'daxian' ? '限' : timeView === 'liunian' ? '年' : undefined;

  const handlePalaceClick = (branch: number) => {
    const isDeselecting = selectedBranch === branch;
    setSelectedBranch(prev => prev === branch ? null : branch);
    if (!isDeselecting) {
      const palace = palaceMap[branch];
      if (palace) onPalaceSelect?.(palace);
    }
  };

  // 三方四正
  const sanFangBranches = selectedBranch !== null ? getSanFangSiZheng(selectedBranch) : null;
  const sanFangSet = sanFangBranches ? new Set(sanFangBranches) : null;

  return (
    <div className="w-full select-none">
      {/* 时间导航轴 */}
      <TimeNav
        chart={chart}
        view={timeView}
        liunianYear={liunianYear}
        onViewChange={setTimeView}
        onYearChange={setLiunianYear}
      />

      {/* Tóm tắt lá số */}
      {(() => {
        const bi = chart.birthInfo, li = chart.lunarInfo;
        const dx = chart.currentDaXianIndex >= 0 ? chart.daXians[chart.currentDaXianIndex] : null;
        const items: [string, React.ReactNode][] = [
          ['Dương lịch', `${bi.day}/${bi.month}/${bi.year}`],
          ['Âm lịch', `${Math.abs(li.lunarDay)}/${li.isLeapMonth ? 'nhuận ' : ''}${Math.abs(li.lunarMonth)} ${STEMS[li.yearStem]}${BRANCHES[li.yearBranch]}年`],
          ['Giờ sinh', `${BRANCHES[bi.hour]}时`],
          ['Âm dương', chart.yinYangGender ?? (bi.gender === 'male' ? '男' : '女')],
          ['Cục', chart.wuxingJuName],
          ['Mệnh chủ / Thân chủ', `${chart.mingZhu ?? ''} / ${chart.shenZhu ?? ''}`],
          ['Đại Hạn hiện tại', dx ? <span style={{ color: '#c084fc' }}>{dx.startAge}–{dx.endAge} tuổi · cung {dx.palaceName.replace(/宫$/, '')}</span> : '—'],
        ];
        return (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="mb-3 rounded-xl px-3 py-3" style={{ background: 'var(--t-card)', border: '1px solid var(--t-border)' }}>
            <div className="text-[15px] font-semibold mb-2" style={{ color: 'var(--t-gold)' }}>
              {bi.name ? `Lá số của ${bi.name}` : 'Lá số Tử Vi Đẩu Số'}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5">
              {items.map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--t-faint)' }}>{k}</div>
                  <div className="text-[13px] font-medium" style={{ color: 'var(--t-text)' }}>{v}</div>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })()}

      {/* 4x4 命盘网格（含 SVG 叠加层） */}
      <div
        className="grid rounded-xl overflow-hidden relative"
        style={{
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(4, auto)',
          gap: '1px',
          background: 'var(--t-border)',
          border: '1px solid var(--t-border)',
          boxShadow: '0 4px 32px rgba(0,0,0,0.15)',
        }}
      >
        {ANIMATION_ORDER.map((branch, i) => {
          const [row, col] = BRANCH_GRID_POS[branch];
          const palace = palaceMap[branch];
          if (!palace) return null;
          return (
            <div key={branch} style={{ gridRow: row, gridColumn: col, background: 'var(--t-bg)' }}>
              <PalaceCell
                palace={palace}
                onClick={() => handlePalaceClick(branch)}
                onStarClick={(star) => onStarSelect?.(star, palace)}
                isSelected={selectedBranch === branch}
                isSanFang={!!(sanFangSet?.has(branch) && selectedBranch !== branch)}
                delay={i * 0.04}
                overlayStarSiHua={Object.keys(overlayData).length > 0 ? overlayData : undefined}
                overlayLabel={overlayLabel}
                onSiHuaClick={(starName, siHua) => onSiHuaClick?.(starName, siHua, timeView)}
                showMinor={showMinor}
              />
            </div>
          );
        })}

        {/* 中央信息区 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center justify-center p-4 gap-3"
          style={{ gridRow: '2 / 4', gridColumn: '2 / 4', background: 'var(--t-bg)' }}
        >
          <div className="text-4xl select-none leading-none" style={{ color: 'var(--t-gold)', opacity: 0.15 }}>☯</div>
          <div className="text-center">
            <div className="text-[12px] font-semibold tracking-wide" style={{ color: 'var(--t-gold)' }}>{chart.wuxingJuName}</div>
            <div className="text-[11px] mt-1" style={{ color: 'var(--t-text2, var(--t-faint))' }}>
              Mệnh tại <b style={{ color: '#f59e0b' }}>{BRANCHES[chart.mingGongBranch]}</b> · Thân tại <b style={{ color: '#38bdf8' }}>{BRANCHES[chart.shenGongBranch]}</b>
            </div>
          </div>
          {chart.currentDaXianIndex >= 0 && (() => {
            const dx = chart.daXians[chart.currentDaXianIndex];
            return (
              <div className="rounded-lg px-3 py-1.5 text-center" style={{ border: '1px solid rgba(147,51,234,0.4)', background: 'rgba(147,51,234,0.08)' }}>
                <div className="text-[10px] mb-0.5" style={{ color: '#c084fc' }}>Đại Hạn hiện tại</div>
                <div className="text-[13px] font-semibold tabular-nums" style={{ color: '#d8b4fe' }}>{dx.startAge}–{dx.endAge} tuổi</div>
              </div>
            );
          })()}
        </motion.div>

        {/* ── 三方四正 SVG 连线（绝对定位在 grid 内部，受 overflow:hidden 裁切） ── */}
        <AnimatePresence>
          {sanFangBranches !== null && (
            <motion.div
              key={`sf-${selectedBranch}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="pointer-events-none"
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 20,
              }}
            >
              <svg
                width="100%"
                height="100%"
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: 'block' }}
              >
                {(() => {
                  // 三角形（三方）+ 一条直线（对宫）
                  const p0 = BRANCH_SVG_POS[sanFangBranches[0]]; // 本宫
                  const p1 = BRANCH_SVG_POS[sanFangBranches[1]]; // 对宫
                  const p2 = BRANCH_SVG_POS[sanFangBranches[2]]; // 三合1
                  const p3 = BRANCH_SVG_POS[sanFangBranches[3]]; // 三合2
                  const dash = "6,5";
                  const stroke = "rgba(37,99,235,0.55)";
                  const sw = "1.5";
                  return (
                    <>
                      {/* 对宫直线：本宫 ↔ 对宫（穿过中心） */}
                      <line
                        x1={`${p0[0]}%`} y1={`${p0[1]}%`}
                        x2={`${p1[0]}%`} y2={`${p1[1]}%`}
                        stroke={stroke} strokeWidth={sw}
                        strokeDasharray={dash} strokeLinecap="round"
                      />
                      {/* 三合三角形：本宫 → 三合1 → 三合2 → 本宫 */}
                      <line
                        x1={`${p0[0]}%`} y1={`${p0[1]}%`}
                        x2={`${p2[0]}%`} y2={`${p2[1]}%`}
                        stroke={stroke} strokeWidth={sw}
                        strokeDasharray={dash} strokeLinecap="round"
                      />
                      <line
                        x1={`${p2[0]}%`} y1={`${p2[1]}%`}
                        x2={`${p3[0]}%`} y2={`${p3[1]}%`}
                        stroke={stroke} strokeWidth={sw}
                        strokeDasharray={dash} strokeLinecap="round"
                      />
                      <line
                        x1={`${p3[0]}%`} y1={`${p3[1]}%`}
                        x2={`${p0[0]}%`} y2={`${p0[1]}%`}
                        stroke={stroke} strokeWidth={sw}
                        strokeDasharray={dash} strokeLinecap="round"
                      />
                      {/* 四个宫位中心标记点 */}
                      {[p0, p1, p2, p3].map((p, i) => (
                        <circle
                          key={i}
                          cx={`${p[0]}%`} cy={`${p[1]}%`}
                          r="3"
                          fill={i === 0 ? 'rgba(37,99,235,0.8)' : 'rgba(37,99,235,0.45)'}
                        />
                      ))}
                    </>
                  );
                })()}
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chú thích */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="mt-3 flex flex-col items-center gap-2">
        <div className="flex items-center justify-center gap-x-3 gap-y-1.5 text-[11px] flex-wrap" style={{ color: 'var(--t-faint)' }}>
          {[['#059669', 'Lộc'], ['#2563eb', 'Quyền'], ['#ca8a04', 'Khoa'], ['#dc2626', 'Kỵ']].map(([c, t]) => (
            <span key={t} className="inline-flex items-center gap-1"><span className="rounded px-1 text-[9px] font-semibold text-white" style={{ background: c }}>{t}</span>Hóa {t}</span>
          ))}
          <span><b className="text-amber-400">Vàng</b> chính tinh · <b style={{ color: '#38bdf8' }}>xanh</b> cát tinh · <b style={{ color: '#f87171' }}>đỏ</b> sát tinh</span>
          <span>(M) Miếu · (V) Vượng · (Đ) Đắc · (L) Lợi · (B) Bình · (H) Hãm</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <button type="button" onClick={() => setShowMinor(v => !v)}
            className="text-[12px] px-3 py-1.5 rounded-full"
            style={{ border: '1px solid var(--t-border)', color: showMinor ? 'var(--t-gold)' : 'var(--t-text)', background: showMinor ? 'rgba(212,168,67,0.1)' : 'transparent' }}>
            {showMinor ? 'Ẩn tạp tinh' : 'Hiện tất cả sao (tạp tinh)'}
          </button>
          <span className="text-[11px]" style={{ color: 'var(--t-faint)' }}>Bấm vào cung để xem Tam phương tứ chính &amp; AI luận cung đó</span>
        </div>
      </motion.div>
    </div>
  );
}
