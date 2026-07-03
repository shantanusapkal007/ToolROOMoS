"use client";

import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Sidebar } from "../components/layout/Sidebar";
import { MissionControl } from "../components/dashboard/MissionControl";
import { useRouter } from "next/navigation";

export default function Home() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get("projects");
      setProjects(res.data || []);
    } catch (err) {
      console.error("Failed to load projects", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden text-white font-sans mission-control-bg">
      <Sidebar />
      <main className="flex-1 h-full flex flex-col relative z-0 pl-16">
        <MissionControl 
          projects={projects} 
          onSelectProject={(proj) => router.push(`/projects/${proj.id}/overview`)} 
        />
      </main>
    </div>
  );
}
