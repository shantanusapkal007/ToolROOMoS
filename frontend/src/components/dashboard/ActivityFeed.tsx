import React from 'react';
import { Activity } from 'lucide-react';

export const ActivityFeed = () => {
  return (
    <div className="bg-black/5 backdrop-blur-xl border border-black/10 rounded-2xl p-6">
      <div className="flex justify-between items-center border-b border-black/10 pb-4 mb-4">
        <h2 className="text-sm font-bold text-zinc-900 tracking-widest uppercase flex items-center">
          <Activity className="w-4 h-4 mr-2 text-blue-600" />
          Live Factory Feed
        </h2>
      </div>
      <div className="text-zinc-500 text-sm flex items-center justify-center py-12">
        Connecting to live telemetry...
      </div>
    </div>
  );
};
