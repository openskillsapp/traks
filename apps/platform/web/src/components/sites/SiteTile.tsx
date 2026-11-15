import type { ReactElement } from 'react';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import type { TimeseriesPoint } from '@traks/shared';
import { api } from '@/lib/api';
import { SiteTileStats } from './SiteTileStats';
import { SiteFavicon } from './SiteFavicon';
import { SITE_RANGE_NAMES, type SiteRange } from './SiteRangeMenu';

export interface TileColor {
  /** Deep companion: icon, chart bars, arrow. */
  deep: string;
  /** Pastel: empty-bucket stubs, icon-chip wash. */
  pastel: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Bucket key ('YYYY-MM-DD' or 'YYYY-MM-DDTHH', site timezone) as a short label. */
function bucketLabel(key: string): string {
  const [day, hour] = key.split('T');
  if (hour !== undefined) return `${hour}:00`;
  const [, m, d] = day.split('-');
  return `${MONTHS[Number(m) - 1] ?? m} ${Number(d)}`;
}

/** Visitors per bucket (hours for today, days otherwise), scaled from zero.
 *  The last bucket is still filling, so it is drawn lighter. */
function VisitorBars({
  points,
  color,
}: {
  points: TimeseriesPoint[];
  color: TileColor;
}): ReactElement {
  if (points.length === 0) return <div className="mt-3.5 h-11 w-full" aria-hidden="true" />;
  const w = 280;
  const h = 44;
  const max = Math.max(1, ...points.map(p => p.visitors));
  const slot = w / points.length;
  const gap = Math.min(4, slot * 0.3);
  const lastI = points.length - 1;

  return (
    // aria-hidden: the numbers below carry the data; the <title>s are hover
    // tooltips only and would otherwise flood the link's accessible name.
    <svg
      className="mt-3.5 block h-11 w-full"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {points.map((p, i) => {
        const x = i * slot + gap / 2;
        const bh = p.visitors > 0 ? Math.max(2, (p.visitors / max) * h) : 1.5;
        return (
          <g key={p.date}>
            <title>{`${bucketLabel(p.date)}: ${p.visitors} visitor${p.visitors === 1 ? '' : 's'}`}</title>
            {/* Full-height hit area so thin bars still show their tooltip. */}
            <rect x={i * slot} y={0} width={slot} height={h} fill="transparent" />
            <rect
              x={x}
              y={h - bh}
              width={slot - gap}
              height={bh}
              rx={Math.min(1.5, (slot - gap) / 2)}
              fill={p.visitors > 0 ? color.deep : color.pastel}
              opacity={i === lastI ? 0.45 : 1}
            />
          </g>
        );
      })}
    </svg>
  );
}

export function SiteTile({
  site,
  color,
  stats,
  isStatsLoading,
  isNew,
  batchIndex,
  range,
  humanOnly,
}: {
  site: { id: string; name: string; domain: string; favicon?: string | null };
  color: TileColor;
  stats: { visitors: number; pageviews: number; sessions: number } | undefined;
  isStatsLoading: boolean;
  isNew: boolean;
  batchIndex: number;
  range: SiteRange;
  humanOnly: boolean;
}): ReactElement {
  // Bars cover the same window and visits as the numbers below them.
  // 'today' is served live from the site's DO; longer ranges are cached scans.
  const { data: sparkData, isLoading: sparkLoading } = useQuery({
    queryKey: ['site-analytics', site.id, 'spark', range, humanOnly],
    queryFn: () => api.getTimeseries(site.id, range, humanOnly ? { human: '1' } : undefined),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
  const sparkPoints = ((sparkData as any)?.data ?? []) as TimeseriesPoint[];

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 16, scale: 0.97 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={
        isNew
          ? { duration: 0.35, ease: [0.25, 0.1, 0.25, 1], delay: batchIndex * 0.05 }
          : { duration: 0 }
      }
    >
      <Link
        to="/portal/site/$siteId"
        params={{ siteId: site.id }}
        className="group relative block rounded-[20px] bg-white p-[22px] shadow-float transition-all duration-300 hover:-translate-y-[3px] hover:shadow-float-lg"
      >
        {/* Header row: icon + name */}
        <div className="flex items-center gap-3">
          {/* Neutral chip for every site; the tile's hue lives in the chart line only. */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#F2F1ED] transition-transform duration-300 group-hover:scale-110">
            <SiteFavicon favicon={site.favicon} size={24} fallbackClassName="text-[#3D3B4F]" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-bold leading-tight text-[#3D3B4F]">
              {site.name}
            </h3>
            <span className="mt-0.5 block truncate text-[12px] text-[#B5B0AA]">{site.domain}</span>
          </div>
        </div>

        {sparkLoading ? (
          <div
            className="mt-3.5 h-11 w-full animate-pulse rounded-xl bg-muted"
            aria-hidden="true"
          />
        ) : (
          <VisitorBars points={sparkPoints} color={color} />
        )}

        {/* Stats for the chosen range */}
        <div className="mt-3.5">
          <span className="mb-2.5 block text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#9B9590]">
            {SITE_RANGE_NAMES[range]}
          </span>
          <SiteTileStats stats={stats} isLoading={isStatsLoading} />
        </div>

        {/* View analytics footer */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[12px] font-semibold text-[#9B9590] transition-colors group-hover:text-[#3D3B4F]">
            View Analytics
          </span>
          <ArrowRight
            className="h-4 w-4 transition-all duration-200 group-hover:translate-x-0.5"
            style={{ color: color.deep }}
            strokeWidth={2}
          />
        </div>
      </Link>
    </motion.div>
  );
}
