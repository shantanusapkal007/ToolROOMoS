import React from 'react';

/**
 * Footer Component matching Design System specs:
 * - bg canvas, text body-mid, padding 3xl (32px / p-8), body text in body-sm (14px/400)
 */
export function Footer() {
  return (
    <footer className="w-full bg-canvas text-body-mid p-8 border-t border-hairline mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-body-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium text-ink">ToolRoomOS</span>
          <span>© {new Date().getFullYear()} Enterprise Manufacturing System</span>
        </div>
        <div className="flex items-center gap-6 text-mute">
          <span>Design Tokens System</span>
          <span>Single Source of Truth</span>
        </div>
      </div>
    </footer>
  );
}
