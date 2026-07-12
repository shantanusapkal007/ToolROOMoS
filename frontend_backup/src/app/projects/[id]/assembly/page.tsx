import { redirect } from 'next/navigation';

export default async function AssemblyTab({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const projectId = `PRJ-${resolvedParams.id.padStart(3, '0')}`;
  
  redirect(`/assembly/manage?project=${projectId}`);
}
