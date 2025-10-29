import React, { useState, useEffect } from 'react';
import { Download, Upload, Database, Trash2, RefreshCw, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { LocalStorageService } from '../lib/localStorage';
import { optimizedFirebase } from '../lib/optimizedFirebase';
import { studentService } from '../lib/studentService';

export function DataManagement() {
  const [storageInfo, setStorageInfo] = useState({ used: 0, available: 0, percentage: 0 });
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    updateStorageInfo();
  }, []);

  const updateStorageInfo = () => {
    const info = LocalStorageService.getStorageInfo();
    setStorageInfo(info);
  };

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await optimizedFirebase.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nsr_data_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showMessage('success', 'Data exported successfully!');
    } catch (error) {
      showMessage('error', 'Failed to export data');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = e.target?.result as string;
        const success = await optimizedFirebase.importData(data);
        
        if (success) {
          updateStorageInfo();
          showMessage('success', 'Data imported successfully!');
          // Refresh the page to update all components
          setTimeout(() => window.location.reload(), 1000);
        } else {
          showMessage('error', 'Failed to import data - invalid format');
        }
      } catch (error) {
        showMessage('error', 'Failed to import data');
        console.error('Import error:', error);
      } finally {
        setIsImporting(false);
        // Reset file input
        event.target.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await optimizedFirebase.syncLocalDataToFirebase();
      showMessage('success', 'Data synced to Firebase successfully!');
    } catch (error) {
      showMessage('error', 'Failed to sync data to Firebase');
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all local data? This action cannot be undone.')) {
      optimizedFirebase.clearAllData();
      updateStorageInfo();
      showMessage('info', 'All local data cleared');
      // Refresh the page
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDeleteAllStudents = async () => {
    if (!window.confirm('This will permanently delete ALL students from Firebase. Proceed?')) return;
    try {
      const count = await studentService.deleteAllStudents();
      showMessage('success', `Deleted ${count} students from Firebase`);
      // Optional: trigger a soft refresh after a short delay so counts update
      setTimeout(() => window.location.reload(), 1000);
    } catch (e) {
      showMessage('error', 'Failed to delete students');
    }
  };

  const handleClearAllEverywhere = async () => {
    if (!window.confirm('This will delete ALL data from Firebase and local storage. This cannot be undone. Proceed?')) return;
    try {
      await optimizedFirebase.clearAllDataEverywhere();
      showMessage('success', 'All Firebase and local data cleared');
      setTimeout(() => window.location.reload(), 1000);
    } catch (e) {
      showMessage('error', 'Failed to clear all data');
    }
  };

  const handleClearAllFirebase = async () => {
    if (!window.confirm('This will delete ALL data from Firebase (students, faculty, courses, assessments, student assessments). Local browser data will remain. Proceed?')) return;
    try {
      await optimizedFirebase.clearAllFirebaseData();
      showMessage('success', 'All Firebase data cleared');
      setTimeout(() => window.location.reload(), 1000);
    } catch (e) {
      showMessage('error', 'Failed to clear Firebase data');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Data Management</h2>
          <p className="text-gray-600 mt-2">Manage your local data and Firebase synchronization</p>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
           message.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
           <Info className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Storage Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Local Storage Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{formatBytes(storageInfo.used)}</div>
            <div className="text-sm text-gray-600">Used Space</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{formatBytes(storageInfo.available)}</div>
            <div className="text-sm text-gray-600">Available Space</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{storageInfo.percentage.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Usage</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                storageInfo.percentage > 80 ? 'bg-red-500' :
                storageInfo.percentage > 60 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Data Operations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Export Data */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Download className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Export Data</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Download all your data as a JSON file for backup or migration.
          </p>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? 'Exporting...' : 'Export Data'}
          </button>
        </div>

        {/* Import Data */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Upload className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold text-gray-900">Import Data</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Upload a JSON file to restore your data from a backup.
          </p>
          <label className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer flex items-center justify-center gap-2">
            {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {isImporting ? 'Importing...' : 'Import Data'}
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={isImporting}
              className="hidden"
            />
          </label>
        </div>

        {/* Sync to Firebase */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <RefreshCw className="w-6 h-6 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Sync to Firebase</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Manually sync your local data to Firebase cloud storage.
          </p>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>

        {/* Clear Data (Local only) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="w-6 h-6 text-red-600" />
            <h3 className="font-semibold text-gray-900">Clear Data</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Clear all local data. This action cannot be undone.
          </p>
          <button
            onClick={handleClearData}
            className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear Local Data
          </button>
        </div>

        {/* Danger Zone: Clear ALL Firebase Data */}
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="w-6 h-6 text-red-600" />
            <h3 className="font-semibold text-gray-900">Danger: Delete ALL Firebase Data</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">Irreversible. Deletes all documents in students, faculty, courses, assessments, and student assessments.</p>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={handleClearAllFirebase}
              className="w-full bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear Firebase Data
            </button>
            <button
              onClick={handleDeleteAllStudents}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete ONLY Students (legacy)
            </button>
          </div>
        </div>

        {/* Danger Zone: Clear EVERYTHING (Firebase + Local) */}
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="w-6 h-6 text-red-700" />
            <h3 className="font-semibold text-gray-900">Danger: Delete ALL Data (Firebase + Local)</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">Destroys all collections in Firebase and clears browser storage.</p>
          <button
            onClick={handleClearAllEverywhere}
            className="w-full bg-red-800 text-white px-4 py-2 rounded-lg hover:bg-red-900 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete EVERYTHING
          </button>
        </div>
      </div>

      {/* Information Panel */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Data Management Information</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Local Storage:</strong> Data is stored locally in your browser for fast access</li>
              <li>• <strong>Firebase Sync:</strong> Data is automatically synced to Firebase every 10 minutes</li>
              <li>• <strong>Offline Support:</strong> You can work offline and sync when connected</li>
              <li>• <strong>Quota Optimization:</strong> Firebase reads/writes are minimized using local caching</li>
              <li>• <strong>Backup:</strong> Export your data regularly to prevent data loss</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
