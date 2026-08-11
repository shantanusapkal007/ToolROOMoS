import React from 'react';
import { Activity } from 'lucide-react';

export const ActivityFeed = () => {
  return (
    <div className="bg-canvas border border-hairline rounded-md p-6 shadow-level-1">
      <div className="flex justify-between items-center border-b border-hairline pb-4 mb-4">
        <h2 className="text-eyebrow-uppercase-sm font-medium text-ink tracking-tight uppercase flex items-center">
          <Activity className="w-4 h-4 mr-2 text-ink" />
          System Activity Feed
        </h2>
      </div>
      <div className="text-mute text-body-sm flex items-center justify-center py-12">
        Loading recent activities...
      </div>
    </div>
  );
};
