export class ExcelEngine {
  static exportToCSV(data: any[], filename: string = 'export.csv') {
    if (!data || data.length === 0) return;

    // Flatten nested objects and extract headers
    const headers = new Set<string>();
    const flattenedData = data.map(row => {
      const flat: Record<string, any> = {};
      
      const flatten = (obj: any, prefix = '') => {
        for (const key in obj) {
          if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            flatten(obj[key], `${prefix}${key}.`);
          } else {
            flat[`${prefix}${key}`] = obj[key];
            headers.add(`${prefix}${key}`);
          }
        }
      };
      
      flatten(row);
      return flat;
    });

    const headerArray = Array.from(headers);
    
    // Convert to CSV
    const csvRows = [
      headerArray.join(','), // Header row
      ...flattenedData.map(row => 
        headerArray.map(header => {
          let value = row[header] === null || row[header] === undefined ? '' : String(row[header]);
          value = value.replace(/"/g, '""'); // escape quotes
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            value = `"${value}"`;
          }
          return value;
        }).join(',')
      )
    ];

    const csvContent = csvRows.join('\n');
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  static exportSelection(data: any[], selectionIds: string[], filename: string = 'selection_export.csv') {
    const selectedData = data.filter(d => selectionIds.includes(d.id));
    this.exportToCSV(selectedData, filename);
  }
}
