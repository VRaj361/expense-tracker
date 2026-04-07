import { useState } from 'react';
import { FileDown, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { exportAPI } from '../services/api';
import { downloadBlob } from '../utils/cn';

export function ReportsPage() {
  const now = new Date();
  const [startDate, setStartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(now.toISOString().split('T')[0]);
  const [loading, setLoading] = useState('');

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setLoading(format);
    try {
      const params = { startDate, endDate };
      const res = format === 'csv'
        ? await exportAPI.csv(params)
        : format === 'excel'
        ? await exportAPI.excel(params)
        : await exportAPI.pdf(params);
      const ext = format === 'excel' ? 'xlsx' : format;
      downloadBlob(res.data, `expense-report-${startDate}-${endDate}.${ext}`);
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch {
      toast.error('Export failed');
    } finally {
      setLoading('');
    }
  };

  const presets = [
    { label: 'This Month', start: new Date(now.getFullYear(), now.getMonth(), 1), end: now },
    { label: 'Last Month', start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 0) },
    { label: 'This Year', start: new Date(now.getFullYear(), 0, 1), end: now },
    { label: 'Last 3 Months', start: new Date(now.getFullYear(), now.getMonth() - 2, 1), end: now },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Reports & Export</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Date Range</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
            <div className="min-w-0">
              <label className="text-sm font-medium mb-1.5 block">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="min-w-0">
              <label className="text-sm font-medium mb-1.5 block">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <Button
                key={p.label}
                size="sm"
                variant="outline"
                onClick={() => {
                  setStartDate(p.start.toISOString().split('T')[0]);
                  setEndDate(p.end.toISOString().split('T')[0]);
                }}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleExport('csv')}>
          <CardContent className="p-6 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 text-emerald-500" />
            <p className="font-semibold mb-1">CSV Export</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Spreadsheet-compatible format</p>
            <Button size="sm" className="mt-3 gap-1.5" disabled={loading === 'csv'}>
              {loading === 'csv' ? 'Exporting...' : <><FileDown className="h-3.5 w-3.5" /> Download</>}
            </Button>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleExport('excel')}>
          <CardContent className="p-6 text-center">
            <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-blue-500" />
            <p className="font-semibold mb-1">Excel Export</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Rich formatting with formulas</p>
            <Button size="sm" className="mt-3 gap-1.5" disabled={loading === 'excel'}>
              {loading === 'excel' ? 'Exporting...' : <><FileDown className="h-3.5 w-3.5" /> Download</>}
            </Button>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleExport('pdf')}>
          <CardContent className="p-6 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 text-red-500" />
            <p className="font-semibold mb-1">PDF Report</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Print-ready expense report</p>
            <Button size="sm" className="mt-3 gap-1.5" disabled={loading === 'pdf'}>
              {loading === 'pdf' ? 'Exporting...' : <><FileDown className="h-3.5 w-3.5" /> Download</>}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
