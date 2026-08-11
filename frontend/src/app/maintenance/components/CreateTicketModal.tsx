import React, { useState } from 'react';
import { useCreateMaintenanceTicket } from '../../../hooks/useMaintenance';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { Combobox } from '../../../components/ui/Combobox';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ isOpen, onClose }) => {
  const [machineId, setMachineId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [assignedToId, setAssignedToId] = useState('');
  const [category, setCategory] = useState('');
  const [downtimeStartedAt, setDowntimeStartedAt] = useState('');
  
  const createTicket = useCreateMaintenanceTicket();
  
  const { data: machines } = useQuery({
    queryKey: ['machines'],
    queryFn: async () => {
      const res = await api.get('/master-data/machines');
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (data?.data) return data.data;
      return [];
    }
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects');
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (data?.data) return data.data;
      return [];
    }
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (data?.data) return data.data;
      return [];
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineId || !issueDescription.trim()) return;

    try {
      await createTicket.mutateAsync({
        machineId,
        projectId: projectId || undefined,
        issueDescription,
        priority: priority as any,
        assignedToId: assignedToId || undefined,
        category: category || undefined,
        downtimeStartedAt: downtimeStartedAt ? new Date(downtimeStartedAt).toISOString() : undefined,
      });

      // Reset form
      setMachineId('');
      setProjectId('');
      setIssueDescription('');
      setPriority('NORMAL');
      setAssignedToId('');
      setCategory('');
      setDowntimeStartedAt('');

      onClose();
    } catch (err) {}
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Machine Breakdown / Maintenance Ticket"
      subtitle="Log asset issue for fast operator assignment and LOTO safety tracking."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-micro font-semibold text-zinc-700 mb-1 uppercase tracking-wider">
            Machine / Shopfloor Asset *
          </label>
          <Combobox
            options={machines?.map((m: any) => ({ value: m.id, label: m.machineCode + ' — ' + m.machineName })) || []}
            value={machineId}
            onChange={setMachineId}
            placeholder="Select machine asset..."
          />
        </div>
        
        <div>
          <label className="block text-micro font-semibold text-zinc-700 mb-1 uppercase tracking-wider">
            Related Project (Optional)
          </label>
          <Combobox
            options={projects?.map((p: any) => ({ value: p.id, label: p.projectNumber + ' — ' + p.partName })) || []}
            value={projectId}
            onChange={setProjectId}
            placeholder="Search active projects..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-micro font-semibold text-zinc-700 mb-1 uppercase tracking-wider">
              Assignee Technician
            </label>
            <Combobox
              options={users?.map((u: any) => ({ value: u.id, label: u.name || u.email })) || []}
              value={assignedToId}
              onChange={setAssignedToId}
              placeholder="Select technician..."
            />
          </div>
          <div>
            <label className="block text-micro font-semibold text-zinc-700 mb-1 uppercase tracking-wider">
              Breakdown Category
            </label>
            <Combobox
              options={[
                { value: 'MECHANICAL', label: 'Mechanical' },
                { value: 'ELECTRICAL', label: 'Electrical' },
                { value: 'HYDRAULIC', label: 'Hydraulic' },
                { value: 'PNEUMATIC', label: 'Pneumatic' },
                { value: 'SOFTWARE', label: 'Software' },
              ]}
              value={category}
              onChange={setCategory}
              placeholder="Select category..."
            />
          </div>
        </div>

        <div>
          <label className="block text-micro font-semibold text-zinc-700 mb-1 uppercase tracking-wider">
            Downtime Started At
          </label>
          <input
            type="datetime-local"
            value={downtimeStartedAt}
            onChange={(e) => setDowntimeStartedAt(e.target.value)}
            className="w-full h-[var(--size-input)] bg-white border border-border-gray px-3 text-caption text-ink rounded-[12px] focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>

        <div>
          <label className="block text-micro font-semibold text-zinc-700 mb-1 uppercase tracking-wider">Priority Level</label>
          <div className="grid grid-cols-3 gap-2">
            {['NORMAL', 'HIGH', 'CRITICAL'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`h-8 px-3 rounded-[12px] border text-caption font-semibold transition-colors cursor-pointer ${
                  priority === p 
                    ? p === 'CRITICAL' ? 'bg-red-50 border-red-300 text-red-700' 
                      : p === 'HIGH' ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : 'bg-primary-subtle border-blue-300 text-primary-dark'
                    : 'bg-white border-border-gray text-zinc-600 hover:bg-canvas'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-micro font-semibold text-zinc-700 mb-1 uppercase tracking-wider">Issue Description *</label>
          <textarea 
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            required
            placeholder="Describe the breakdown, symptoms, and potential hazards..."
            className="w-full bg-white border border-border-gray rounded-[12px] p-3 text-caption text-ink placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 h-24 resize-none"
          />
        </div>

        <div className="pt-3 border-t border-border-gray flex justify-end gap-2">
          <Button type="button" variant="white" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={createTicket.isPending || !machineId || !issueDescription.trim()}
          >
            {createTicket.isPending ? 'Reporting...' : 'Submit Ticket'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
