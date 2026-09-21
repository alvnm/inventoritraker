import { weightStatus, WEIGHT_STATUS_META } from '../../lib/format';

export default function WeightBar({ current, max, compact }: { current: number; max: number; compact?: boolean }) {
  const status = weightStatus(current, max);
  const meta = WEIGHT_STATUS_META[status];
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-parchment/60">
          {current} / {max} lb
        </span>
        <span className={`font-semibold ${meta.color}`}>{meta.label}</span>
      </div>
      <div className={`w-full overflow-hidden rounded-full bg-ink-700 ${compact ? 'h-1.5' : 'h-2.5'}`}>
        <div
          className={`h-full rounded-full transition-all ${meta.bar} ${status === 'over' ? 'animate-pulse' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
