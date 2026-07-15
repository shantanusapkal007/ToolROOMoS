"use client";

import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Sidebar } from "../components/layout/Sidebar";
import { MissionControl } from "../components/dashboard/MissionControl";
import { useRouter } from "next/navigation";

import { useProjects } from "../hooks/useProjects";

export default function Home() {
  const { data: projects = [], isLoading: loading } = useProjects();
  const router = useRouter();

  return (
    <div className="flex h-screen w-full overflow-hidden text-zinc-900 font-sans mission-control-bg">
      <Sidebar />
      <main className="flex-1 h-screen overflow-hidden flex flex-col relative z-0 pl-[5.5rem]">
        <MissionControl 
          projects={projects} 
          onSelectProject={(proj) => router.push(`/projects/${proj.id}/overview`)} 
        />
      </main>
    </div>
  );
}
