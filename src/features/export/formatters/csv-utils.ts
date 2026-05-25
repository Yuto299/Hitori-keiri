/**
 * CSV共通ユーティリティ(第5章 5.5.1 / 5.5.4)
 *
 * エスケープ・日付変換・摘要(メモ)結合を各フォーマッタで共有する。
 */

import type { Receipt } from '@/shared/types/receipt';

/** セルのエスケープ(カンマ・改行・引用符) */
export function escapeCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** 配列を1行に */
export function toRow(cells: string[]): string {
  return cells.map(escapeCell).join(',');
}

/** YYYY-MM-DD → YYYY/MM/DD(会計ソフト慣習) */
export function toCsvDate(isoDate: string): string {
  return isoDate.replace(/-/g, '/');
}

/**
 * メモ各項目を摘要1セルに結合(第5章 5.5.4)。
 * 例: "目的 / 同席者: ○○ / 案件: △△ / (自由メモ)"
 * 空項目はスキップ。交際費の同席者は税務上重要なので存在すれば必ず含める。
 */
export function buildSummary(receipt: Receipt): string {
  const parts: string[] = [];
  const { purpose, attendees, project, note } = receipt.memo;
  if (purpose) parts.push(purpose);
  if (attendees) parts.push(`同席者: ${attendees}`);
  if (project) parts.push(`案件: ${project}`);
  if (note) parts.push(note);
  return parts.join(' / ');
}

/** CRLF で結合(第5章 5.5.1) */
export function joinCsv(lines: string[]): string {
  return lines.join('\r\n');
}
