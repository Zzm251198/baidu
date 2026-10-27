import { useEffect, useRef, useState } from 'react';
import { dataSource } from '../data/source';
import type { DataBundle, LineInfo } from '../data/types';

interface UseDataBundleResult {
  bundle: DataBundle | null;
  loading: boolean;
  error: string;
  sourceKind: 'mock' | 'http';
}

/**
 * 统一的数据入口。mock 源同步返回（首屏零闪烁），http 源异步拉取。
 * 组件层不再直接 import mock 数据，换源时无需改动。
 */
export function useDataBundle(fallbackLines: LineInfo[]): UseDataBundleResult {
  const [bundle, setBundle] = useState<DataBundle | null>(() => dataSource.loadSync?.(fallbackLines) ?? null);
  const [loading, setLoading] = useState(!dataSource.loadSync);
  const [error, setError] = useState('');
  const requestRef = useRef(0);

  useEffect(() => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    let cancelled = false;

    setLoading(true);
    dataSource
      .load(fallbackLines)
      .then((next) => {
        if (cancelled || requestId !== requestRef.current) return;
        setBundle(next);
        setError('');
      })
      .catch((loadError: unknown) => {
        if (cancelled || requestId !== requestRef.current) return;
        setError(loadError instanceof Error ? loadError.message : '数据加载失败');
      })
      .finally(() => {
        if (cancelled || requestId !== requestRef.current) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fallbackLines]);

  return { bundle, loading, error, sourceKind: dataSource.kind };
}
