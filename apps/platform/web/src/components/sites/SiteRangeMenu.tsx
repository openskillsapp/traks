import type { ReactElement } from 'react';
import { CalendarDays, Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/** Window for the Sites page: tile numbers, bars and the visitors sort. */
export type SiteRange = 'today' | '7d' | '30d' | '90d';

export const SITE_RANGE_NAMES: Record<SiteRange, string> = {
  today: 'Today',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
};

const SITE_RANGES = Object.keys(SITE_RANGE_NAMES) as SiteRange[];

interface SiteRangeMenuProps {
  value: SiteRange;
  onChange: (range: SiteRange) => void;
}

/** Pill button that opens the range options, styled like the sort menu. */
export function SiteRangeMenu({ value, onChange }: SiteRangeMenuProps): ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Date range"
        className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-[#E6E4DE] bg-white pl-3.5 pr-3 text-[13px] font-semibold text-[#3D3B4F] cursor-pointer"
      >
        <CalendarDays className="h-[15px] w-[15px] text-[#9B9590]" strokeWidth={1.8} />
        <span className="hidden whitespace-nowrap sm:inline">{SITE_RANGE_NAMES[value]}</span>
        <ChevronDown className="h-3.5 w-3.5 text-[#9B9590]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 rounded-2xl border-none bg-white p-1.5 shadow-float"
      >
        {SITE_RANGES.map(option => (
          <DropdownMenuItem
            key={option}
            onClick={() => onChange(option)}
            className={cn(
              'justify-between rounded-[10px] px-3 py-2.5 text-[13.5px] text-[#3D3B4F]',
              value === option && 'bg-[#F2F1ED] font-semibold'
            )}
          >
            {SITE_RANGE_NAMES[option]}
            {value === option && <Check className="h-4 w-4 text-[#3D3B4F]" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
