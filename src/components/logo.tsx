import { cn } from '@/lib/utils';

export function Logo({ className, variant = 'default' }: { className?: string, variant?: 'default' | 'enterprise' }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="bg-primary rounded-md p-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-dot"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="1"/></svg>
      </div>
      <div className="flex flex-col">
        <span className="text-base font-bold leading-none">OmniToken</span>
        {variant === 'enterprise' && <span className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground">ENTERPRISE</span>}
      </div>
    </div>
  );
}
