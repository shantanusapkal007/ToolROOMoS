import React from 'react';

export interface SectionCardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  featured?: boolean;
}

/**
 * SectionCard component matching Design_System.md (Kraken theme):
 * - bg white, text ink (#101114), border border-gray (#dedee5), padding 24px, radius 12px, shadow subtle
 */
export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  featured = false,
}) => {
  return (
    <div
      className={`bg-white border ${
        featured ? 'border-primary shadow-subtle' : 'border-border-gray shadow-subtle'
      } rounded-[12px] p-6 ${className}`}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b border-border-gray">
          <div>
            {title && <h3 className="text-feature-title font-semibold text-ink tracking-tight">{title}</h3>}
            {subtitle && <p className="text-caption text-silver-blue mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};
