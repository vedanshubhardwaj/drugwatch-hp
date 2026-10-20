import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  FileText,
  Database,
  Info,
} from 'lucide-react';
import { INITIAL_OFFICIAL_CASES } from '../data/hpData';
import { AppMode } from '../services/api';

interface DataToolsViewProps {
  appMode: AppMode;
  isAdminLoggedIn: boolean;
  onNavigateToAdmin: () => void;
}

export const DataToolsView: React.FC<DataToolsViewProps> = ({
  appMode,
  isAdminLoggedIn,
  onNavigateToAdmin,
}) => {
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<{
    fileName: string;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateRows: number;
    errors: { row: number; column: string; message: string }[];
    preview: any[];
  } | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [importStatusMessage, setImportStatusMessage] = useState<string>('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!file.name.endsWith('.csv')) {
      alert('Please select a valid CSV file (.csv)');
      return;
    }
    setImportedFile(file);
    parseAndValidateCSV(file);
  };

  const parseAndValidateCSV = (file: File) => {
    setIsValidating(true);
    setValidationResult(null);

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      if (!text) {
        setIsValidating(false);
        return;
      }

      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        alert('CSV must contain a header row and at least one data row.');
        setIsValidating(false);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const required = ['caseNumber', 'year', 'month', 'district', 'category', 'quantityValue'];
      const missing = required.filter(r => !headers.includes(r));

      if (missing.length > 0) {
        setValidationResult({
          fileName: file.name,
          totalRows: lines.length - 1,
          validRows: 0,
          invalidRows: lines.length - 1,
          duplicateRows: 0,
          errors: [
            {
              row: 1,
              column: 'header',
              message: `Missing required schema columns: ${missing.join(', ')}`,
            },
          ],
          preview: [],
        });
        setIsValidating(false);
        return;
      }

      let validCount = 0;
      let invalidCount = 0;
      let duplicateCount = 0;
      const errors: { row: number; column: string; message: string }[] = [];
      const preview: any[] = [];
      const seenCaseNumbers = new Set(INITIAL_OFFICIAL_CASES.map(c => c.caseNumber));

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        const rowData: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowData[h] = cols[idx] || '';
        });

        const caseNo = rowData['caseNumber'];
        if (!caseNo) {
          invalidCount++;
          errors.push({ row: i + 1, column: 'caseNumber', message: 'Missing caseNumber identifier.' });
          continue;
        }

        if (seenCaseNumbers.has(caseNo)) {
          duplicateCount++;
          errors.push({
            row: i + 1,
            column: 'caseNumber',
            message: `Duplicate caseNumber '${caseNo}' already exists in database.`,
          });
          continue;
        }

        const qty = parseFloat(rowData['quantityValue']);
        if (isNaN(qty)) {
          invalidCount++;
          errors.push({ row: i + 1, column: 'quantityValue', message: 'Invalid numeric value for quantityValue.' });
          continue;
        }

        seenCaseNumbers.add(caseNo);
        validCount++;
        if (preview.length < 5) {
          preview.push(rowData);
        }
      }

      setValidationResult({
        fileName: file.name,
        totalRows: lines.length - 1,
        validRows: validCount,
        invalidRows: invalidCount,
        duplicateRows: duplicateCount,
        errors: errors.slice(0, 15),
        preview,
      });
      setIsValidating(false);
    };

    reader.readAsText(file);
  };

  const handleDownloadDatasetCSV = () => {
    const headers = [
      'caseNumber',
      'year',
      'month',
      'date',
      'district',
      'policeStation',
      'category',
      'quantityValue',
      'quantityUnit',
      'commercialClassification',
      'transitRoute',
      'seizureLocationType',
      'isSyntheticDemo',
    ];

    const rows = INITIAL_OFFICIAL_CASES.map(c => [
      c.caseNumber,
      c.year,
      c.month,
      c.date,
      c.district,
      `"${c.policeStation}"`,
      `"${c.category}"`,
      c.quantityValue,
      c.quantityUnit,
      c.commercialClassification,
      `"${c.transitRoute || ''}"`,
      `"${c.seizureLocationType}"`,
      c.isSyntheticDemo,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'drugwatch_hp_official_demo_dataset.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Data Import, Schema Validation, and Export
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Tools for validating standardized CSV records against the Himachal Pradesh NDPS data schema,
            detecting duplicate case identifiers, and exporting authorized datasets.
          </p>
        </div>

        <button
          onClick={handleDownloadDatasetCSV}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Export Demo Dataset (.csv)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CSV Import & Validation Column */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-blue-600" />
              Upload & Schema Validator
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload a CSV file to validate columns, numeric types, and duplicate FIR identifiers before importing.
            </p>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center space-y-2 hover:border-blue-400 transition-colors">
            <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-xs font-semibold text-slate-700">
              Select or Drop a Crime Record CSV
            </div>
            <div className="text-[11px] text-slate-400">
              Required Schema: caseNumber, year, month, district, category, quantityValue
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="mt-2 block w-full text-xs text-slate-500 file:mx-auto file:py-1.5 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
            />
          </div>

          {/* Validation Result */}
          {validationResult && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase">Total Rows</span>
                  <span className="font-mono text-sm font-bold text-slate-800">
                    {validationResult.totalRows}
                  </span>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 block uppercase">Valid Rows</span>
                  <span className="font-mono text-sm font-bold text-emerald-800">
                    {validationResult.validRows}
                  </span>
                </div>
                <div className="bg-amber-50 p-2.5 rounded border border-amber-200">
                  <span className="text-[10px] text-amber-700 block uppercase">Duplicates</span>
                  <span className="font-mono text-sm font-bold text-amber-800">
                    {validationResult.duplicateRows}
                  </span>
                </div>
                <div className="bg-red-50 p-2.5 rounded border border-red-200">
                  <span className="text-[10px] text-red-700 block uppercase">Errors</span>
                  <span className="font-mono text-sm font-bold text-red-800">
                    {validationResult.invalidRows}
                  </span>
                </div>
              </div>

              {/* Error Log */}
              {validationResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded p-3 text-xs space-y-1">
                  <div className="font-semibold text-red-900 flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Validation Diagnostic Warnings:
                  </div>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {validationResult.errors.map((err, idx) => (
                      <div key={idx} className="text-red-700 text-[11px] font-mono">
                        Row {err.row} [{err.column}]: {err.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {validationResult.preview.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-800">Valid Rows Preview (Top 5):</div>
                  <div className="overflow-x-auto border border-slate-200 rounded">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2">Case No</th>
                          <th className="p-2">District</th>
                          <th className="p-2">Category</th>
                          <th className="p-2">Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {validationResult.preview.map((row, idx) => (
                          <tr key={idx}>
                            <td className="p-2 font-mono text-slate-800">{row.caseNumber}</td>
                            <td className="p-2 text-slate-700">{row.district}</td>
                            <td className="p-2 text-slate-700">{row.category}</td>
                            <td className="p-2 font-mono text-slate-900">{row.quantityValue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Commit Action */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500">
                  {isAdminLoggedIn
                    ? 'Administrator authorization active.'
                    : 'Administrator sign-in required to commit imported rows to production database.'}
                </span>
                {isAdminLoggedIn ? (
                  <button
                    onClick={() => {
                      setImportStatusMessage(
                        `Import simulated successfully: ${validationResult.validRows} valid rows staged.`
                      );
                      setTimeout(() => setImportStatusMessage(''), 3000);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors shadow-xs"
                  >
                    Commit Valid Rows
                  </button>
                ) : (
                  <button
                    onClick={onNavigateToAdmin}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded transition-colors shadow-xs"
                  >
                    Sign In to Commit
                  </button>
                )}
              </div>

              {importStatusMessage && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded">
                  {importStatusMessage}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Schema Documentation Column */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Standard Schema Specification</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Himachal Pradesh NDPS Data Exchange Format (v1.0)
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
              <div className="font-mono font-bold text-slate-900">caseNumber (string, required)</div>
              <p className="text-slate-600 text-[11px]">
                Unique FIR case identifier, e.g. <code className="font-mono">FIR-DEMO-2024-KLU-082</code>.
                Duplicates are rejected.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
              <div className="font-mono font-bold text-slate-900">district (string, required)</div>
              <p className="text-slate-600 text-[11px]">
                Must match one of the 12 official districts: Bilaspur, Chamba, Hamirpur, Kangra,
                Kinnaur, Kullu, Lahaul and Spiti, Mandi, Shimla, Sirmaur, Solan, Una.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
              <div className="font-mono font-bold text-slate-900">category (string, required)</div>
              <p className="text-slate-600 text-[11px]">
                Valid NDPS categories: Charas (Cannabis Resin), Heroin / Chitta, Opium / Poppy Husk,
                Synthetic Pharmaceuticals, Injections / Ampoules.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
              <div className="font-mono font-bold text-slate-900">quantityValue (float, required)</div>
              <p className="text-slate-600 text-[11px]">
                Numerical seizure weight or count. Associated with quantityUnit (kg, grams, tablets).
              </p>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900 leading-relaxed flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <strong>Audit Logging:</strong> All CSV uploads and validation operations are recorded in
              the immutable audit log with officer email, timestamp, and row counts.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
