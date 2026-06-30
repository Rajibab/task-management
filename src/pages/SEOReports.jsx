import React, { useState } from 'react';
import { 
  FolderOpen, Plus, Trash2, Download, Calendar, FileText, 
  FileDown, X, ChevronDown, ChevronUp, Sparkles, Filter, Info
} from 'lucide-react';
import firebaseService from '../firebaseService';

export default function SEOReports({ 
  seoReports = [], 
  setSeoReports = () => {}, 
  currentRole, 
  logActivity = () => {},
  brandColor = 'indigo',
  clients = [],
  currentUser = null
}) {
  
  // Resolve client context for client role
  const clientRecord = (currentRole === 'client' && currentUser)
    ? (clients.find(c => c.email?.toLowerCase() === currentUser.email?.toLowerCase()) || clients[0])
    : null;
  
  const clientCompanyName = clientRecord ? clientRecord.companyName : '';

  // selected client for admin/team dropdown filter
  const [selectedClientName, setSelectedClientName] = useState(
    clients.length > 0 ? clients[0].companyName : ''
  );

  // Active client reports filtering
  const activeClientName = currentRole === 'client' ? clientCompanyName : selectedClientName;
  const filteredReports = seoReports.filter(r => 
    r.clientName?.toLowerCase() === activeClientName?.toLowerCase()
  );

  // Modal toggles & form state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'SEO Report', // SEO Report, Marketing Report, Audit, Normal Report
    month: 'June',
    uploadDate: new Date().toISOString().split('T')[0],
    details: '',
    fileName: '',
    fileSize: ''
  });

  // Toggled description states for reports
  const [expandedReportId, setExpandedReportId] = useState(null);

  // Month list for dropdown
  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Group reports by month
  const groupedReports = monthsList.reduce((acc, m) => {
    const reportsInMonth = filteredReports.filter(r => r.month === m);
    if (reportsInMonth.length > 0) {
      acc[m] = reportsInMonth;
    }
    return acc;
  }, {});

  // Handle file picker selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Calculate human-readable size
      const sizeStr = file.size > 1024 * 1024 
        ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
        : (file.size / 1024).toFixed(0) + ' KB';
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadForm(prev => ({
          ...prev,
          fileName: file.name,
          fileSize: sizeStr,
          fileData: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit report upload
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadForm.title || !uploadForm.fileName) {
      alert('Please enter a title and select a file.');
      return;
    }

    const newReportId = `rep-${Date.now()}`;
    const newReport = {
      id: newReportId,
      clientId: currentRole === 'client' ? (clientRecord?.id || 'cli-1') : (clients.find(c => c.companyName === selectedClientName)?.id || 'cli-1'),
      clientName: activeClientName,
      title: uploadForm.title,
      category: uploadForm.category,
      month: uploadForm.month,
      uploadDate: uploadForm.uploadDate,
      details: uploadForm.details,
      fileName: uploadForm.fileName,
      fileSize: uploadForm.fileSize,
      fileData: uploadForm.fileData || ''
    };

    try {
      await firebaseService.saveDocument('seoReports', newReportId, newReport);
      setSeoReports(prev => [newReport, ...prev]);
      logActivity('Report Uploaded', `Uploaded ${uploadForm.category} "${uploadForm.title}" for ${activeClientName}.`);
      setIsUploadOpen(false);
      // Reset form
      setUploadForm({
        title: '',
        category: 'SEO Report',
        month: 'June',
        uploadDate: new Date().toISOString().split('T')[0],
        details: '',
        fileName: '',
        fileSize: '',
        fileData: ''
      });
    } catch (err) {
      console.error('Failed to save uploaded report:', err);
      alert('Failed to upload report to database.');
    }
  };

  // Delete report
  const handleDeleteReport = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete the report "${title}"?`)) {
      try {
        await firebaseService.deleteDocument('seoReports', id);
        setSeoReports(prev => prev.filter(r => r.id !== id));
        logActivity('Report Deleted', `Removed report "${title}" from ${activeClientName} repository.`);
      } catch (err) {
        console.error('Failed to delete report:', err);
        alert('Failed to delete report.');
      }
    }
  };

  // Download Simulated File
  const handleDownloadFile = (report) => {
    if (report.fileData) {
      fetch(report.fileData)
        .then(res => res.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', report.fileName);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        })
        .catch(err => {
          console.error("Failed to download file from base64:", err);
          fallbackDownload(report);
        });
    } else {
      fallbackDownload(report);
    }
  };

  const fallbackDownload = (report) => {
    // Generate a simple simulated file content
    const content = `================================================
OMNIMARK DIGITAL MARKETING OPERATING SYSTEM
REPORT DOCUMENT FILE V1.0
================================================
Client Name  : ${report.clientName}
Report Title : ${report.title}
Category     : ${report.category}
Month Period : ${report.month}
Upload Date  : ${report.uploadDate}
File Details : ${report.fileName} (${report.fileSize})

REPORT DESCRIPTION:
------------------------------------------------
${report.details || 'No additional notes provided.'}

------------------------------------------------
Generated securely via OmniMark OS. All rights reserved.`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Download as a txt file but retain file prefix
    link.setAttribute('download', report.fileName.endsWith('.pdf') ? report.fileName.replace('.pdf', '_ReportDetails.txt') : `${report.fileName}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Styling Helpers
  const getBrandTextColor = () => {
    switch (brandColor) {
      case 'emerald': return 'text-emerald-400';
      case 'violet': return 'text-violet-400';
      case 'amber': return 'text-amber-400';
      default: return 'text-indigo-400';
    }
  };

  const getBrandBg = () => {
    switch (brandColor) {
      case 'emerald': return 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500';
      case 'violet': return 'bg-violet-500 hover:bg-violet-600 focus:ring-violet-500';
      case 'amber': return 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500';
      default: return 'bg-indigo-500 hover:bg-indigo-600 focus:ring-indigo-500';
    }
  };

  const getBrandBorderColor = () => {
    switch (brandColor) {
      case 'emerald': return 'border-emerald-500/20';
      case 'violet': return 'border-violet-500/20';
      case 'amber': return 'border-amber-500/20';
      default: return 'border-indigo-500/20';
    }
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'Audit': return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'SEO Report': return 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400';
      case 'Marketing Report': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      default: return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
    }
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">Document & Report Repository</h2>
            
            {currentRole === 'client' ? (
              <span className="text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 flex items-center gap-1 w-max">
                🔒 Client Folder: {activeClientName}
              </span>
            ) : (
              <div className="relative flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedClientName}
                  onChange={(e) => setSelectedClientName(e.target.value)}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-bold rounded-xl py-1.5 px-3 focus:outline-none cursor-pointer transition-all"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.companyName}>{c.companyName}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Access, download, and manage audit briefs, visual assets, and marketing reviews.
          </p>
        </div>
        
        {currentRole !== 'client' && (
          <button 
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-md cursor-pointer transition-all hover:scale-105 active:scale-[0.95] ${getBrandBg()}`}
          >
            <Plus className="w-4 h-4" /> Upload Report File
          </button>
        )}
      </div>

      {/* Main Reports Repository View */}
      {Object.keys(groupedReports).length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-900 rounded-3xl space-y-4 max-w-xl mx-auto">
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 text-slate-500 w-16 h-16 flex items-center justify-center mx-auto shadow-inner">
            <FolderOpen className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-slate-350">No Reports Found</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
            This repository is currently empty for <strong>{activeClientName}</strong>. 
            {currentRole !== 'client' ? ' Use the upload button at the top to publish your first marketing report or audit file.' : ' Your account manager has not published any documents here yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {monthsList.slice().reverse().map(month => {
            const reports = groupedReports[month];
            if (!reports) return null;

            return (
              <div key={month} className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
                
                {/* Month Group Header */}
                <div className="px-5 py-4 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Calendar className={`w-4 h-4 ${getBrandTextColor()}`} />
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-300">
                      {month} Releases
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                    {reports.length} {reports.length === 1 ? 'document' : 'documents'}
                  </span>
                </div>

                {/* Reports File Grid */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reports.map(report => {
                    const isExpanded = expandedReportId === report.id;
                    return (
                      <div 
                        key={report.id} 
                        className={`p-4 bg-slate-950/60 border rounded-xl flex flex-col justify-between transition-all group ${
                          isExpanded ? getBrandBorderColor() + ' bg-slate-950/90' : 'border-slate-850 hover:border-slate-800'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${getCategoryBadge(report.category)}`}>
                                {report.category}
                              </span>
                              <h4 className="text-xs font-bold text-slate-200 mt-2 tracking-wide">
                                {report.title}
                              </h4>
                            </div>
                            
                            {/* Actions for Admin/Team */}
                            {currentRole !== 'client' && (
                              <button
                                onClick={() => handleDeleteReport(report.id, report.title)}
                                className="p-1.5 text-slate-500 hover:text-red-400 bg-slate-900 hover:bg-red-500/10 border border-slate-850 rounded-lg cursor-pointer transition-colors focus:outline-none"
                                title="Delete Report"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* File Details Bar */}
                          <div className="flex items-center gap-2 p-2 bg-slate-900/60 border border-slate-900 rounded-lg text-[10px] text-slate-400">
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate font-semibold flex-1 text-slate-350">{report.fileName}</span>
                            <span className="text-[9px] text-slate-500 shrink-0 font-mono">{report.fileSize || 'N/A'}</span>
                          </div>
                        </div>

                        {/* Collapsible Details */}
                        <div className="mt-3 space-y-2.5">
                          <button
                            onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                            className="w-full flex items-center justify-between text-[10px] text-slate-500 hover:text-slate-300 font-bold transition-colors"
                          >
                            <span className="flex items-center gap-1">
                              <Info className="w-3 h-3 text-slate-500" /> Report Details
                            </span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          {isExpanded && (
                            <div className="p-2.5 bg-slate-950 border border-slate-900 rounded-lg text-[10px] text-slate-450 leading-relaxed animate-in fade-in duration-200">
                              {report.details || 'No additional summary details entered for this report.'}
                              <div className="text-[8px] text-slate-500 mt-2 flex justify-between font-mono">
                                <span>Uploaded: {report.uploadDate}</span>
                                <span>Ref: {report.id}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Download Trigger */}
                        <div className="border-t border-slate-900/60 pt-3 mt-3 flex items-center justify-between">
                          <span className="text-[9px] text-slate-500 font-semibold font-mono">
                            📥 {report.uploadDate}
                          </span>
                          <button
                            onClick={() => handleDownloadFile(report)}
                            className={`flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 rounded-lg text-[10px] font-bold cursor-pointer transition-all focus:outline-none`}
                          >
                            <FileDown className="w-3.5 h-3.5" /> Download Report
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800/80 flex justify-between items-center bg-slate-950/40">
              <div className="flex items-center gap-2">
                <FolderOpen className={`w-5 h-5 ${getBrandTextColor()}`} />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Upload Report Document</h3>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4 text-xs">
              
              {/* Target Client Detail Display */}
              <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex justify-between items-center">
                <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider">Target Folder:</span>
                <span className="text-indigo-400 font-extrabold font-mono text-[10px]">{activeClientName}</span>
              </div>

              {/* Title Field */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Report Title</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. June Monthly SEO Audit Brief"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-250 focus:outline-none placeholder-slate-650"
                />
              </div>

              {/* Double Column Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Category</label>
                  <select 
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-250 focus:outline-none cursor-pointer"
                  >
                    <option value="SEO Report">SEO Report</option>
                    <option value="Marketing Report">Marketing Report</option>
                    <option value="Audit">Audit Brief</option>
                    <option value="Normal Report">Normal Report</option>
                  </select>
                </div>

                {/* Period Selection */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Release Month</label>
                  <select 
                    value={uploadForm.month}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, month: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-250 focus:outline-none cursor-pointer"
                  >
                    {monthsList.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Upload Date Picker */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Upload / Publish Date</label>
                <input 
                  type="date"
                  required
                  value={uploadForm.uploadDate}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, uploadDate: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-250 focus:outline-none"
                />
              </div>

              {/* Notes Textarea */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Details & Action Summary</label>
                <textarea 
                  rows="3"
                  placeholder="Enter a brief description of the report files, crucial takeaways, or pending tasks..."
                  value={uploadForm.details}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, details: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-250 focus:outline-none placeholder-slate-650 resize-none leading-relaxed"
                />
              </div>

              {/* Styled File Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Attach Report File</label>
                <div className="flex items-center gap-3">
                  <label className={`px-4 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer font-bold text-slate-350 hover:text-slate-200 transition-colors flex items-center gap-1.5`}>
                    <Plus className="w-4 h-4" /> Select File
                    <input 
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
                    />
                  </label>
                  
                  <div className="flex-1 min-w-0 bg-slate-950/40 p-2.5 border border-slate-900 rounded-xl text-[10px] text-slate-500 font-mono truncate">
                    {uploadForm.fileName ? (
                      <span className="text-slate-300 font-bold flex items-center justify-between">
                        <span className="truncate">{uploadForm.fileName}</span>
                        <span className="text-slate-500 font-mono ml-2 shrink-0">{uploadForm.fileSize}</span>
                      </span>
                    ) : (
                      'No file chosen'
                    )}
                  </div>
                </div>
              </div>

              {/* Submit triggers */}
              <div className="border-t border-slate-800/80 pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="flex-1 py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 font-bold rounded-xl cursor-pointer transition-colors focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-3 text-white font-bold rounded-xl cursor-pointer transition-colors shadow-lg focus:outline-none ${getBrandBg()}`}
                >
                  Publish Report
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
