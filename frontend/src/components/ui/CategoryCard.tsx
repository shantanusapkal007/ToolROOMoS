import React from 'react';

export type CategoryColor = 'purple' | 'pink' | 'blue' | 'orange' | 'green';

interface CategoryCardProps {
  color: CategoryColor;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * CategoryCard Component matching Design System specs:
 * - Full-bleed accent background, white text (except green which uses primary/ink text for contrast)
 * - Padding: 3xl (32px / p-8), Radius: md (8px / rounded-[12px])
 */
export const CategoryCard: React.FC<CategoryCardProps> = ({
  color,
  title,
  subtitle,
  children,
  className = '',
}) => {
  const colorStyles: Record<CategoryColor, string> = {
    purple: 'bg-accent-purple text-on-primary',
    pink: 'bg-accent-pink text-on-primary',
    blue: 'bg-accent-blue text-on-primary',
    orange: 'bg-accent-orange text-on-primary',
    green: 'bg-accent-green text-primary', // Dark/primary text on light green for contrast
  };

  return (
    <div className={`p-8 rounded-[12px] ${colorStyles[color]} flex flex-col justify-between ${className}`}>
      <div>
        <h3 className="text-display-sm font-medium tracking-tight mb-1">
          {title}
        </h3>
        {subtitle && (
          <p className={`text-body-sm ${color === 'green' ? 'text-primary/80' : 'text-on-primary/80'}`}>
            {subtitle}
          </p>
        )}
      </div>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
};
