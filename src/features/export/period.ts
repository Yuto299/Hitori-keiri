/**
 * CSV出力の期間指定(FR-19)
 *
 * 出力対象を「全期間 / 年 / 月 / 任意範囲」で絞り込む。
 * レシートの date は 'YYYY-MM-DD' と 'YYYY/MM/DD' が混在しうるため、比較前に正規化する。
 * UI(出力画面 S-06)からは filterReceiptsByPeriod / periodLabel / periodTag を使う。
 */

import type { Receipt } from '@/shared/types/receipt';

export type ExportPeriod =
  | { kind: 'all' }
  | { kind: 'year'; year: number }
  | { kind: 'month'; year: number; month: number } // month: 1〜12
  | { kind: 'range'; from: string; to: string }; // 'YYYY-MM-DD'(両端を含む)

/** 'YYYY/MM/DD' → 'YYYY-MM-DD'。桁不足(2026-5-1 等)も0埋めして揃える */
export function normalizeIsoDate(value: string): string {
  const m = value.trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (!m) return value.trim();
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
}

/** 'YYYY-MM-DD' として妥当か(任意範囲の入力チェック) */
export function isValidIsoDate(value: string): boolean {
  const n = normalizeIsoDate(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(n)) return false;
  const d = new Date(`${n}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === n;
}

/** 期間の [開始, 終了](両端含む・'YYYY-MM-DD')。全期間は null */
export function periodBounds(period: ExportPeriod): { from: string; to: string } | null {
  switch (period.kind) {
    case 'all':
      return null;
    case 'year':
      return { from: `${period.year}-01-01`, to: `${period.year}-12-31` };
    case 'month': {
      const mm = String(period.month).padStart(2, '0');
      const lastDay = new Date(Date.UTC(period.year, period.month, 0)).getUTCDate();
      return { from: `${period.year}-${mm}-01`, to: `${period.year}-${mm}-${lastDay}` };
    }
    case 'range':
      return { from: normalizeIsoDate(period.from), to: normalizeIsoDate(period.to) };
  }
}

/** 期間でレシートを絞り込む(文字列比較で足りるよう ISO 形式に正規化して比較) */
export function filterReceiptsByPeriod(receipts: Receipt[], period: ExportPeriod): Receipt[] {
  const bounds = periodBounds(period);
  if (!bounds) return receipts;
  return receipts.filter((r) => {
    const d = normalizeIsoDate(r.date);
    return d >= bounds.from && d <= bounds.to;
  });
}

/** 画面表示用ラベル(例: 2026年 / 2026年5月 / 2026-01-01〜2026-03-31) */
export function periodLabel(period: ExportPeriod): string {
  switch (period.kind) {
    case 'all':
      return '全期間';
    case 'year':
      return `${period.year}年`;
    case 'month':
      return `${period.year}年${period.month}月`;
    case 'range':
      return `${normalizeIsoDate(period.from)}〜${normalizeIsoDate(period.to)}`;
  }
}

/** ファイル名に埋め込む期間タグ(例: 2026 / 2026-05 / 2026-01-01_2026-03-31)。全期間は undefined */
export function periodTag(period: ExportPeriod): string | undefined {
  switch (period.kind) {
    case 'all':
      return undefined;
    case 'year':
      return String(period.year);
    case 'month':
      return `${period.year}-${String(period.month).padStart(2, '0')}`;
    case 'range':
      return `${normalizeIsoDate(period.from)}_${normalizeIsoDate(period.to)}`;
  }
}
