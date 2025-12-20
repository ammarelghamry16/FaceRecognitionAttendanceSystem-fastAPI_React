/**
 * Export utilities for attendance data
 */

export interface ExportRecord {
  studentId: string;
  studentName?: string;
  status: string;
  time: string;
  date: string;
  method: string;
  confidence?: number;
}

/**
 * Export data to CSV format
 */
export function exportToCSV(records: ExportRecord[], filename: string): void {
  const headers = ['Student ID', 'Student Name', 'Status', 'Date', 'Time', 'Method', 'Confidence'];

  const csvContent = [
    headers.join(','),
    ...records.map(record => [
      record.studentId,
      record.studentName || '-',
      record.status,
      record.date,
      record.time,
      record.method,
      record.confidence ? `${(record.confidence * 100).toFixed(1)}%` : '-'
    ].map(field => `"${field}"`).join(','))
  ].join('\n');

  downloadFile(csvContent, `${filename}.csv`, 'text/csv');
}

/**
 * Export data to PDF format (simple HTML-based PDF)
 */
export function exportToPDF(
  records: ExportRecord[],
  _filename: string,
  title: string,
  summary?: { present: number; absent: number; late: number }
): void {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .summary-item { padding: 10px 20px; border-radius: 8px; }
        .present { background: #dcfce7; color: #166534; }
        .absent { background: #fee2e2; color: #991b1b; }
        .late { background: #fef3c7; color: #92400e; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #f3f4f6; font-weight: 600; }
        tr:nth-child(even) { background: #f9fafb; }
        .status-present { color: #166534; }
        .status-absent { color: #991b1b; }
        .status-late { color: #92400e; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      ${summary ? `
        <div class="summary">
          <div class="summary-item present">Present: ${summary.present}</div>
          <div class="summary-item absent">Absent: ${summary.absent}</div>
          <div class="summary-item late">Late: ${summary.late}</div>
        </div>
      ` : ''}
      <table>
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Name</th>
            <th>Status</th>
            <th>Date</th>
            <th>Time</th>
            <th>Method</th>
            <th>Confidence</th>
          </tr>
        </thead>
        <tbody>
          ${records.map(record => `
            <tr>
              <td>${record.studentId}</td>
              <td>${record.studentName || '-'}</td>
              <td class="status-${record.status}">${record.status.charAt(0).toUpperCase() + record.status.slice(1)}</td>
              <td>${record.date}</td>
              <td>${record.time}</td>
              <td>${record.method}</td>
              <td>${record.confidence ? `${(record.confidence * 100).toFixed(1)}%` : '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="footer">
        Generated on ${new Date().toLocaleString()} | AttendanceAI System
      </div>
    </body>
    </html>
  `;

  // Open in new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

/**
 * Helper to download a file
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
