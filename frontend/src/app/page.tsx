"use client";

import { useProjects } from "../hooks/useProjects";
import { AppLayout } from "../components/layout/AppLayout";
import { MissionControl } from "../components/dashboard/MissionControl";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: projects = [] } = useProjects();
  const router = useRouter();

  return (
    <AppLayout noPadding>
      <MissionControl 
        projects={projects} 
        onSelectProject={(proj) => router.push(`/projects/${proj.id}/overview`)} 
      />
    </AppLayout>
  );
}
