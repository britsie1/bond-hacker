import { format } from 'date-fns';
import type { StrategyResult } from './calculateResults';

function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportCombinedSummary(results: StrategyResult[]) {
  if (!results || results.length === 0) return;

  const maxMonths = Math.max(...results.map(r => r.result.schedule.length));
  
  // Headers
  let csv = 'Month,Date';
  results.forEach(r => {
    csv += `,"${r.strategy.name} Balance"`;
  });
  csv += '\n';

  // Rows
  for (let i = 0; i < maxMonths; i++) {
    // Try to get date from the first strategy that still has entries
    const refResult = results.find(r => i < r.result.schedule.length);
    if (!refResult) break;
    
    const entryDate = refResult.result.schedule[i].date;
    const dateStr = format(entryDate, 'MMM yyyy');
    
    csv += `${i + 1},${dateStr}`;
    
    results.forEach(r => {
      if (i < r.result.schedule.length) {
        csv += `,${r.result.schedule[i].closingBalance.toFixed(2)}`;
      } else {
        csv += `,0.00`;
      }
    });
    csv += '\n';
  }

  downloadCsv('BondHacker_Combined_Summary.csv', csv);
}

export function exportDetailedAmortization(result: StrategyResult) {
  if (!result || !result.result.schedule) return;

  const headers = [
    'Month',
    'Date',
    'Opening Balance',
    'Standard Payment',
    'Extra Payment',
    'Total Payment',
    'Interest Charged',
    'Principal Paid',
    'Closing Balance'
  ];

  let csv = headers.join(',') + '\n';

  result.result.schedule.forEach((entry, i) => {
    const totalPayment = entry.payment + entry.extraPayment;
    const row = [
      i + 1,
      format(entry.date, 'MMM yyyy'),
      entry.openingBalance.toFixed(2),
      entry.payment.toFixed(2),
      entry.extraPayment.toFixed(2),
      totalPayment.toFixed(2),
      entry.interest.toFixed(2),
      entry.principal.toFixed(2),
      entry.closingBalance.toFixed(2)
    ];
    csv += row.join(',') + '\n';
  });

  const sanitizedName = result.strategy.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  downloadCsv(`BondHacker_Amortization_${sanitizedName}.csv`, csv);
}
