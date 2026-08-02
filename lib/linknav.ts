'use client';

const STORAGE_KEY = 'lnk-nav';

export interface ListNavContext {
  api: string;
  ids: string[];
  page: number;
  pageSize: number;
  total: number;
}

export function storeListNavigation(
  apiEndpoint: string,
  ids: string[],
  page: number,
  pageSize: number,
  total: number
) {
  if (typeof window === 'undefined' || !apiEndpoint || ids.length === 0) return;
  try {
    const ctx: ListNavContext = { api: apiEndpoint, ids, page, pageSize, total };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
  } catch {
    // storage unavailable — navigation pill just won't appear
  }
}

export function readListNavigation(): ListNavContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const ctx = JSON.parse(raw) as ListNavContext;
    if (!ctx || !ctx.api || !Array.isArray(ctx.ids)) return null;
    return ctx;
  } catch {
    return null;
  }
}

export async function fetchListPage(
  apiEndpoint: string,
  page: number,
  pageSize: number
): Promise<{ ids: string[]; total: number } | null> {
  const sep = apiEndpoint.includes('?') ? '&' : '?';
  const res = await fetch(`${apiEndpoint}${sep}limit=${pageSize}&page=${page}`);
  if (!res.ok) return null;
  const data = await res.json();
  const ids = (data.links || []).map((l: any) => String(l.id));
  return { ids, total: data.total ?? 0 };
}