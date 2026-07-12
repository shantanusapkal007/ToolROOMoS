import { LoadingState } from '../components/ui/LoadingState';

export default function Loading() {
  return (
    <div className="flex-1 h-full flex flex-col relative z-0">
      <LoadingState message="Connecting to ToolRoomOS..." />
    </div>
  );
}
