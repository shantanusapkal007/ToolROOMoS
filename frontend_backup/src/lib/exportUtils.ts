export const exportToCsv = (filename: string, rows: any[], columns: any[]) => {
  if (!rows || !rows.length) {
    return;
  }

  // Extract column keys and labels
  const keys = columns.map(col => col.key);
  const labels = columns.map(col => col.label);

  const processRow = (row: any) => {
    return keys.map(key => {
      let val = row[key] === null || row[key] === undefined ? '' : row[key];
      // Wrap strings with commas in quotes
      const strVal = String(val);
      if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
        return `"${strVal.replace(/"/g, '""')}"`;
      }
      return strVal;
    }).join(',');
  };

  const csvContent = [
    labels.join(','),
    ...rows.map(processRow)
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
