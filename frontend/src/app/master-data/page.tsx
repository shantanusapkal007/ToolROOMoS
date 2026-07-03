"use client";

import { Sidebar } from "../../components/layout/Sidebar";
import { MasterDataModule } from '../../modules/settings/MasterDataModule';

export default function MasterDataPage() {
  return (
    <div className="flex h-screen w-screen overflow-hidden text-white font-sans mission-control-bg">
      <Sidebar />
      <MasterDataModule />
    </div>
  );
}
