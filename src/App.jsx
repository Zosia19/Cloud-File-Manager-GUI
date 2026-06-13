import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import * as api from './api';
import { getUserIdFromToken } from './api';
import LoginPage from './components/LoginPage';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [username, setUsername] = useState(() => localStorage.getItem('username') || '');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pathStack, setPathStack] = useState([{ path: '/', id: null }]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [fileToDelete, setFileToDelete] = useState(null);
  const [fileToRename, setFileToRename] = useState(null);
  const [newFileName, setNewFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('list');
  const [totalSpace] = useState(1073741824);
  const fileInputRef = useRef(null);
  const loadIdRef = useRef(0);

  const currentPath = pathStack[pathStack.length - 1].path;
  const currentDirectoryId = pathStack[pathStack.length - 1].id;

  // ── Auth ──────────────────────────────────────────────────────────────────

  const handleLogin = (accessToken, name) => {
    setToken(accessToken);
    setUsername(name || '');
  };

  const handleLogout = () => {
    loadIdRef.current++; // invalidate any in-flight loadItems calls
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setUsername('');
    setFiles([]);
    setPathStack([{ path: '/', id: null }]);
  };

  // ── Load items from API ────────────────────────────────────────────────────

  const loadItems = useCallback(async () => {
    if (!token) return;
    const loadId = ++loadIdRef.current;
    setLoading(true);
    try {
      const currentUserId = getUserIdFromToken(token);
      const allItems = await api.listItems(currentPath, token);
      if (loadIdRef.current !== loadId) return;
      const items = currentUserId
        ? allItems.filter(item => item.userId === currentUserId)
        : allItems;
      const enriched = await Promise.all(
        items.map(async (item) => {
          if (item.type === 'file') {
            try {
              const details = await api.getFile(item.id, token);
              return {
                id: item.id,
                name: item.name,
                type: 'file',
                bytes: details.size,
                mtime: new Date().toISOString(),
                path: currentPath,
              };
            } catch {
              return { id: item.id, name: item.name, type: 'file', bytes: 0, mtime: new Date().toISOString(), path: currentPath };
            }
          }
          return { id: item.id, name: item.name, type: 'dir', bytes: 0, mtime: new Date().toISOString(), path: currentPath };
        })
      );
      if (loadIdRef.current !== loadId) return;
      setFiles(enriched);
    } catch (err) {
      if (loadIdRef.current !== loadId) return;
      if (err.response?.status === 401) {
        showToast('Sesja wygasła — zaloguj się ponownie', 'error');
        setTimeout(handleLogout, 1500);
      } else {
        showToast('Błąd podczas ładowania plików', 'error');
      }
    } finally {
      if (loadIdRef.current === loadId) setLoading(false);
    }
  }, [token, currentPath]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadItems();
  }, [loadItems]);


  // ── Helpers ───────────────────────────────────────────────────────────────

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '—';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getFileIcon = (file) => {
    if (file.type === 'dir') return '📁';
    const ext = file.name.split('.').pop()?.toLowerCase();
    const iconMap = {
      pdf: '📕', doc: '📘', docx: '📘', txt: '📝', md: '📝',
      jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', svg: '🖼️', webp: '🖼️',
      mp3: '🎵', wav: '🎵', flac: '🎵',
      mp4: '🎬', avi: '🎬', mkv: '🎬', mov: '🎬',
      zip: '📦', rar: '📦', '7z': '📦', tar: '📦', gz: '📦',
      js: '⚡', ts: '💎', jsx: '⚛️', tsx: '⚛️',
      py: '🐍', java: '☕', rb: '💎', go: '🔵',
      html: '🌐', css: '🎨', scss: '🎨',
      sql: '🗄️', json: '📋', xml: '📋', csv: '📊',
      pptx: '📊', ppt: '📊', xlsx: '📊', xls: '📊',
      exe: '⚙️', sh: '⚙️', bat: '⚙️',
    };
    return iconMap[ext] || '📄';
  };

  const getFileTypeColor = (ext) => {
    const colorMap = {
      pdf: '#ef4444', doc: '#3b82f6', docx: '#3b82f6', txt: '#6b7280',
      jpg: '#f59e0b', jpeg: '#f59e0b', png: '#f59e0b', gif: '#f59e0b',
      js: '#eab308', ts: '#3b82f6', jsx: '#06b6d4', html: '#f97316', css: '#8b5cf6',
      zip: '#10b981', rar: '#10b981',
      sql: '#6366f1', json: '#a855f7',
      pptx: '#f43f5e', xlsx: '#22c55e',
    };
    return colorMap[ext] || '#94a3b8';
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Stats ─────────────────────────────────────────────────────────────────

  const totalUsed = files.filter(f => f.type === 'file').reduce((acc, f) => acc + (f.bytes || 0), 0);

  const usageData = [
    { name: 'Zajęte', value: totalUsed, color: '#6366f1' },
    { name: 'Wolne', value: Math.max(totalSpace - totalUsed, 0), color: darkMode ? '#1e293b' : '#e2e8f0' },
  ];

  const fileTypeStats = useMemo(() => {
    const stats = {};
    files.filter(f => f.type === 'file').forEach(f => {
      const ext = f.name.split('.').pop()?.toLowerCase() || 'other';
      if (!stats[ext]) stats[ext] = { count: 0, bytes: 0 };
      stats[ext].count++;
      stats[ext].bytes += f.bytes || 0;
    });
    return Object.entries(stats).sort((a, b) => b[1].bytes - a[1].bytes).slice(0, 5);
  }, [files]);

  const recentFiles = useMemo(() => {
    return [...files].filter(f => f.type === 'file').sort((a, b) => new Date(b.mtime) - new Date(a.mtime)).slice(0, 4);
  }, [files]);

  // ── Filtering & sorting ────────────────────────────────────────────────────

  const filteredAndSortedFiles = useMemo(() => {
    let result = [...files];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(f => f.name.toLowerCase().includes(query));
    }
    result.sort((a, b) => {
      if (a.type === 'dir' && b.type !== 'dir') return -1;
      if (a.type !== 'dir' && b.type === 'dir') return 1;
      let comparison = 0;
      switch (sortBy) {
        case 'name': comparison = a.name.localeCompare(b.name); break;
        case 'size': comparison = (a.bytes || 0) - (b.bytes || 0); break;
        case 'date': comparison = new Date(a.mtime) - new Date(b.mtime); break;
        default: comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return result;
  }, [files, searchQuery, sortBy, sortOrder]);

  // ── Navigation ────────────────────────────────────────────────────────────

  const navigateToFolder = (folderName, folderId) => {
    const newPath = currentPath === '/' ? '/' + folderName : currentPath + '/' + folderName;
    setPathStack(prev => [...prev, { path: newPath, id: folderId || null }]);
    setSelectedFile(null);
    setSearchQuery('');
  };

  const navigateToBreadcrumb = (pathIndex) => {
    if (pathIndex === -1) {
      setPathStack([{ path: '/', id: null }]);
    } else {
      setPathStack(prev => prev.slice(0, pathIndex + 2));
    }
    setSelectedFile(null);
    setSearchQuery('');
  };

  const getPathParts = () => currentPath.split('/').filter(Boolean);

  const goBack = () => {
    if (pathStack.length > 1) {
      setPathStack(prev => prev.slice(0, -1));
      setSelectedFile(null);
    }
  };

  // ── Sorting ───────────────────────────────────────────────────────────────

  const handleSort = (column) => {
    if (sortBy === column) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(column); setSortOrder('asc'); }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return '↕';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // ── Upload ────────────────────────────────────────────────────────────────

  const handleFileUpload = async (uploadedFiles) => {
    setShowUploadModal(false);
    setUploading(true);
    const fileArray = Array.from(uploadedFiles);
    let successCount = 0;
    for (const file of fileArray) {
      try {
        await api.uploadFile(file, currentDirectoryId || '', token);
        successCount++;
      } catch (err) {
        showToast(`Błąd przy przesyłaniu "${file.name}"`, 'error');
      }
    }
    setUploading(false);
    if (successCount > 0) showToast(`Przesłano ${successCount} plik${successCount === 1 ? '' : 'ów'}`);
    await loadItems();
  };

  // ── New folder ─────────────────────────────────────────────────────────────

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) { showToast('Podaj nazwę katalogu', 'error'); return; }
    try {
      await api.createDirectory(newFolderName.trim(), currentDirectoryId || '', token);
      setShowNewFolderModal(false);
      setNewFolderName('');
      showToast(`Utworzono katalog "${newFolderName.trim()}"`);
      await loadItems();
    } catch (err) {
      const msg = err.response?.status === 409 ? 'Katalog o takiej nazwie już istnieje' : 'Błąd podczas tworzenia katalogu';
      showToast(msg, 'error');
    }
  };

  // ── Rename ─────────────────────────────────────────────────────────────────

  const handleRenameClick = (file, e) => {
    e.stopPropagation();
    setFileToRename(file);
    setNewFileName(file.name);
    setShowRenameModal(true);
  };

  const confirmRename = async () => {
    if (!newFileName.trim()) { showToast('Podaj nową nazwę', 'error'); return; }
    if (newFileName.trim() === fileToRename.name) { setShowRenameModal(false); setFileToRename(null); setNewFileName(''); return; }
    try {
      if (fileToRename.type === 'file') {
        await api.renameFile(fileToRename.id, newFileName.trim(), token);
      } else {
        await api.renameDirectory(fileToRename.id, newFileName.trim(), token);
      }
      showToast(`Zmieniono nazwę na "${newFileName.trim()}"`);
      setShowRenameModal(false);
      setFileToRename(null);
      setNewFileName('');
      await loadItems();
    } catch (err) {
      const msg = err.response?.status === 409 ? 'Plik o takiej nazwie już istnieje' : 'Błąd podczas zmiany nazwy';
      showToast(msg, 'error');
    }
  };

  // ── Drag & drop ───────────────────────────────────────────────────────────

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragOver(false); };
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files); };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDeleteClick = (file, index, e) => {
    e.stopPropagation();
    setFileToDelete({ file, index });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    const { file } = fileToDelete;
    try {
      if (file.type === 'file') {
        await api.deleteFile(file.id, token);
      } else {
        await api.deleteDirectory(file.id, token);
      }
      showToast(`Usunięto "${file.name}"`);
      setShowDeleteModal(false);
      setFileToDelete(null);
      setSelectedFile(null);
      await loadItems();
    } catch {
      showToast('Błąd podczas usuwania', 'error');
    }
  };

  // ── Download ──────────────────────────────────────────────────────────────

  const handleDownload = async (file, e) => {
    e.stopPropagation();
    try {
      const res = await api.downloadFile(file.id, token);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Pobrano "${file.name}"`);
    } catch {
      showToast(`Błąd podczas pobierania "${file.name}"`, 'error');
    }
  };

  const handleDownloadDirectory = async (dir, e) => {
    e.stopPropagation();
    try {
      showToast(`Pakowanie "${dir.name}"...`);
      const res = await api.downloadDirectory(dir.id, dir.name, token);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dir.name}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Pobrano "${dir.name}.zip"`);
    } catch {
      showToast(`Błąd podczas pobierania katalogu`, 'error');
    }
  };

  const usagePercent = totalSpace > 0 ? Math.min(((totalUsed / totalSpace) * 100), 100).toFixed(0) : 0;

  // ── Guard: show login if not authenticated ────────────────────────────────

  if (!token) {
    return <LoginPage onLogin={handleLogin} darkMode={darkMode} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 relative overflow-hidden ${
      darkMode
        ? 'bg-gradient-to-br from-slate-950 via-purple-950/80 to-slate-950'
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
    }`}>
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl animate-float ${darkMode ? 'bg-indigo-600/10' : 'bg-indigo-300/20'}`} />
        <div className={`absolute top-1/2 -left-40 w-80 h-80 rounded-full blur-3xl animate-float-reverse ${darkMode ? 'bg-purple-600/10' : 'bg-purple-300/15'}`} />
        <div className={`absolute -bottom-40 right-1/3 w-72 h-72 rounded-full blur-3xl animate-pulse-slow ${darkMode ? 'bg-pink-600/8' : 'bg-pink-300/15'}`} />
      </div>

      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-2xl shadow-2xl animate-toast-in ${
          toast.type === 'success'
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-500/25'
            : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-500/25'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-white/20">
              {toast.type === 'success' ? '✓' : '✕'}
            </div>
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* ============ MODALS ============ */}

      {/* Modal przesyłania pliku */}
      {showUploadModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowUploadModal(false)} />
          <div className={`relative w-full max-w-lg rounded-3xl p-8 animate-scale-in glass-card border ${
            darkMode ? 'bg-slate-800/90 border-white/10' : 'bg-white/95 border-gray-200'
          }`}>
            <h3 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Prześlij plik</h3>
            <div
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ${
                dragOver
                  ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]'
                  : darkMode ? 'border-slate-600 hover:border-indigo-500/50' : 'border-gray-300 hover:border-indigo-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
                <span className="text-4xl">📂</span>
              </div>
              <p className={`mb-1 font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Przeciągnij i upuść pliki tutaj</p>
              <p className={`text-sm mb-4 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>lub kliknij przycisk poniżej</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all font-medium shadow-lg shadow-indigo-500/25 btn-press"
              >
                Wybierz pliki
              </button>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && handleFileUpload(e.target.files)} />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className={`px-5 py-2.5 rounded-xl font-medium transition-colors btn-press ${darkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nowego katalogu */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowNewFolderModal(false)} />
          <div className={`relative w-full max-w-md rounded-3xl p-8 animate-scale-in glass-card border ${darkMode ? 'bg-slate-800/90 border-white/10' : 'bg-white/95 border-gray-200'}`}>
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                <span className="text-4xl">📁</span>
              </div>
              <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Nowy katalog</h3>
            </div>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Nazwa katalogu"
              className={`w-full px-5 py-3.5 rounded-xl border-2 outline-none transition-all mb-6 ${darkMode ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-indigo-500 focus:bg-slate-700' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:bg-white'}`}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowNewFolderModal(false); setNewFolderName(''); }}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors btn-press ${darkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              >
                Anuluj
              </button>
              <button
                onClick={handleCreateFolder}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all font-medium shadow-lg shadow-indigo-500/25 btn-press"
              >
                Utwórz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal potwierdzenia usunięcia */}
      {showDeleteModal && fileToDelete && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowDeleteModal(false)} />
          <div className={`relative w-full max-w-md rounded-3xl p-8 animate-scale-in glass-card border ${darkMode ? 'bg-slate-800/90 border-white/10' : 'bg-white/95 border-gray-200'}`}>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/25">
                <span className="text-4xl">🗑️</span>
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Potwierdź usunięcie</h3>
              <p className={`mb-8 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Czy na pewno chcesz usunąć <strong className={darkMode ? 'text-white' : 'text-gray-800'}>"{fileToDelete.file.name}"</strong>?
                {fileToDelete.file.type === 'dir' && ' Ten katalog zostanie usunięty wraz z zawartością.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors btn-press ${darkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              >
                Anuluj
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-medium shadow-lg shadow-red-500/25 btn-press"
              >
                Usuń
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal zmiany nazwy */}
      {showRenameModal && fileToRename && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowRenameModal(false)} />
          <div className={`relative w-full max-w-md rounded-3xl p-8 animate-scale-in glass-card border ${darkMode ? 'bg-slate-800/90 border-white/10' : 'bg-white/95 border-gray-200'}`}>
            <div className="text-center mb-6">
              <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg ${
                fileToRename.type === 'dir' ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/25' : 'bg-gradient-to-br from-indigo-400 to-purple-500 shadow-indigo-500/25'
              }`}>
                <span className="text-4xl">{getFileIcon(fileToRename)}</span>
              </div>
              <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Zmień nazwę</h3>
            </div>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="Nowa nazwa"
              className={`w-full px-5 py-3.5 rounded-xl border-2 outline-none transition-all mb-6 ${darkMode ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-indigo-500 focus:bg-slate-700' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:bg-white'}`}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && confirmRename()}
              onFocus={(e) => {
                const lastDot = e.target.value.lastIndexOf('.');
                if (lastDot > 0 && fileToRename.type === 'file') e.target.setSelectionRange(0, lastDot);
                else e.target.select();
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowRenameModal(false); setFileToRename(null); setNewFileName(''); }}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors btn-press ${darkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              >
                Anuluj
              </button>
              <button
                onClick={confirmRename}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all font-medium shadow-lg shadow-indigo-500/25 btn-press"
              >
                Zmień
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ NAVBAR ============ */}
      <nav className={`sticky top-0 z-30 backdrop-blur-2xl border-b transition-all duration-500 ${darkMode ? 'bg-slate-950/70 border-white/5' : 'bg-white/80 border-gray-200/80'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-transform hover:scale-105">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <div>
                <h1 className={`text-lg font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Cloud<span className="gradient-text">Drive</span>
                </h1>
                <p className={`text-[11px] font-medium tracking-wide uppercase ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>File Manager</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Wyszukiwarka desktop */}
              <div className={`hidden md:flex items-center gap-2 rounded-2xl px-4 py-2.5 border transition-all duration-300 ${darkMode ? 'bg-white/5 border-white/10 focus-within:border-indigo-500/50 focus-within:bg-white/10' : 'bg-gray-100 border-gray-200 focus-within:border-indigo-400 focus-within:bg-white'}`}>
                <svg className={`w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Szukaj plików..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`bg-transparent text-sm outline-none w-48 ${darkMode ? 'text-white placeholder-slate-500' : 'text-gray-800 placeholder-gray-400'}`}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className={`w-5 h-5 rounded-full flex items-center justify-center text-xs transition-colors ${darkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-300 text-gray-600 hover:bg-gray-400'}`}>✕</button>
                )}
              </div>

              {/* View mode toggle */}
              <div className={`hidden sm:flex items-center rounded-xl border p-1 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? (darkMode ? 'bg-indigo-500/30 text-indigo-300' : 'bg-indigo-100 text-indigo-600') : (darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600')}`} title="Widok listy">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? (darkMode ? 'bg-indigo-500/30 text-indigo-300' : 'bg-indigo-100 text-indigo-600') : (darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600')}`} title="Widok siatki">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </button>
              </div>

              {/* Dark mode toggle */}
              <button onClick={() => setDarkMode(!darkMode)} className={`p-2.5 rounded-xl transition-all duration-300 btn-press ${darkMode ? 'bg-white/10 hover:bg-white/15 text-yellow-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`} title={darkMode ? 'Tryb jasny' : 'Tryb ciemny'}>
                {darkMode ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
              </button>

              {/* Logout button */}
              <button onClick={handleLogout} className={`p-2.5 rounded-xl transition-all duration-300 btn-press ${darkMode ? 'bg-white/10 hover:bg-red-500/20 text-slate-400 hover:text-red-400' : 'bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500'}`} title="Wyloguj">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>

              {/* Upload spinner */}
              {uploading && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30">
                  <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <span className={`text-xs font-medium ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>Przesyłanie...</span>
                </div>
              )}

              {/* Avatar */}
              <div className="relative group" title={username}>
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-orange-400 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-pink-500/20 cursor-pointer transition-transform hover:scale-105">
                  {username ? username.slice(0, 2).toUpperCase() : 'CD'}
                </div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 bg-emerald-500 ${darkMode ? 'border-slate-950' : 'border-white'}`} />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ============ MAIN CONTENT ============ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ====== SIDEBAR ====== */}
          <div className="lg:col-span-1 space-y-5 animate-slide-left">

            {/* Karta zajętości */}
            <div className={`glass-card rounded-3xl p-6 border transition-all duration-500 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200 shadow-xl shadow-gray-200/50'}`}>
              <h2 className={`text-xs font-bold uppercase tracking-widest mb-5 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Przestrzeń dyskowa</h2>
              <div className="h-44 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={usageData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} dataKey="value" strokeWidth={0} startAngle={90} endAngle={-270}>
                      {usageData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(value) => formatSize(value)} contentStyle={{ background: darkMode ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)', border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb', borderRadius: '12px', color: darkMode ? 'white' : '#1f2937', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{usagePercent}%</span>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>wykorzystane</span>
                </div>
              </div>
              <div className="space-y-3 mt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500" /><span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Zajęte</span></div>
                  <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{formatSize(totalUsed)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><div className={`w-2.5 h-2.5 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-gray-300'}`} /><span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Wolne</span></div>
                  <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{formatSize(Math.max(totalSpace - totalUsed, 0))}</span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden mt-2 ${darkMode ? 'bg-slate-800' : 'bg-gray-200'}`}>
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000" style={{ width: `${usagePercent}%` }} />
                </div>
              </div>
            </div>

            {/* Typy plików */}
            {fileTypeStats.length > 0 && (
              <div className={`glass-card rounded-3xl p-6 border transition-all duration-500 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200 shadow-xl shadow-gray-200/50'}`}>
                <h2 className={`text-xs font-bold uppercase tracking-widest mb-5 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Typy plików</h2>
                <div className="space-y-3">
                  {fileTypeStats.map(([ext, stat]) => (
                    <div key={ext} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white uppercase" style={{ backgroundColor: getFileTypeColor(ext) + '30', color: getFileTypeColor(ext) }}>.{ext}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-medium uppercase ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>{ext}</span>
                          <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>{stat.count} {stat.count === 1 ? 'plik' : 'plików'}</span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full ${darkMode ? 'bg-slate-800' : 'bg-gray-200'}`}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${totalUsed > 0 ? Math.min((stat.bytes / totalUsed) * 100, 100) : 0}%`, backgroundColor: getFileTypeColor(ext) }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ostatnio modyfikowane */}
            {recentFiles.length > 0 && (
              <div className={`glass-card rounded-3xl p-6 border transition-all duration-500 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200 shadow-xl shadow-gray-200/50'}`}>
                <h2 className={`text-xs font-bold uppercase tracking-widest mb-5 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Pliki w katalogu</h2>
                <div className="space-y-3">
                  {recentFiles.map((file) => (
                    <div key={file.id || file.name} className={`flex items-center gap-3 p-2 -mx-2 rounded-xl cursor-pointer transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${darkMode ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>{getFileIcon(file)}</div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{file.name}</p>
                        <p className={`text-[10px] ${darkMode ? 'text-slate-600' : 'text-gray-400'}`}>{formatSize(file.bytes)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`glass-card rounded-2xl p-4 border text-center transition-all duration-500 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200 shadow-xl shadow-gray-200/50'}`}>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{files.filter(f => f.type === 'file').length}</p>
                <p className={`text-[10px] font-semibold uppercase tracking-wider mt-1 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Pliki</p>
              </div>
              <div className={`glass-card rounded-2xl p-4 border text-center transition-all duration-500 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200 shadow-xl shadow-gray-200/50'}`}>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{files.filter(f => f.type === 'dir').length}</p>
                <p className={`text-[10px] font-semibold uppercase tracking-wider mt-1 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Katalogi</p>
              </div>
            </div>
          </div>

          {/* ====== MAIN PANEL ====== */}
          <div className="lg:col-span-3 animate-slide-right">
            <div className={`glass-card rounded-3xl border overflow-hidden transition-all duration-500 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200 shadow-xl shadow-gray-200/50'}`}>

              {/* Header */}
              <div className={`p-5 sm:p-6 border-b transition-colors duration-500 ${darkMode ? 'border-white/5' : 'border-gray-100'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      Moje pliki
                      {searchQuery && <span className={`ml-2 text-sm font-normal ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>— wyniki dla "{searchQuery}"</span>}
                    </h2>
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-0.5 mt-2 flex-wrap">
                      <button
                        onClick={() => navigateToBreadcrumb(-1)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium transition-all btn-press ${
                          currentPath === '/'
                            ? (darkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-600')
                            : (darkMode ? 'hover:bg-white/10 text-slate-500 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-800')
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        <span>Root</span>
                      </button>
                      {getPathParts().map((part, index) => (
                        <div key={index} className="flex items-center gap-0.5">
                          <svg className={`w-4 h-4 ${darkMode ? 'text-slate-700' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                          <button
                            onClick={() => navigateToBreadcrumb(index)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium transition-all btn-press ${
                              index === getPathParts().length - 1
                                ? (darkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-600')
                                : (darkMode ? 'hover:bg-white/10 text-slate-500 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-800')
                            }`}
                          >
                            {part}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {currentPath !== '/' && (
                      <button onClick={goBack} className={`px-3.5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 btn-press ${darkMode ? 'bg-white/10 hover:bg-white/15 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`} title="Wstecz">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        <span className="hidden sm:inline">Wstecz</span>
                      </button>
                    )}
                    <button onClick={() => setShowNewFolderModal(true)} className={`px-3.5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 btn-press ${darkMode ? 'bg-white/10 hover:bg-white/15 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                      <span className="hidden sm:inline">Nowy folder</span>
                    </button>
                    <button onClick={() => setShowUploadModal(true)} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 sm:px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 flex items-center gap-2 btn-press">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      <span className="hidden sm:inline">Prześlij</span>
                    </button>
                  </div>
                </div>

                {/* Mobile search */}
                <div className={`mt-4 md:hidden flex items-center gap-2 rounded-xl px-4 py-2.5 border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                  <svg className={`w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input type="text" placeholder="Szukaj plików..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`bg-transparent text-sm outline-none flex-1 ${darkMode ? 'text-white placeholder-slate-500' : 'text-gray-800 placeholder-gray-400'}`} />
                  {searchQuery && <button onClick={() => setSearchQuery('')} className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${darkMode ? 'bg-white/10 text-white' : 'bg-gray-300 text-gray-600'}`}>✕</button>}
                </div>
              </div>

              {/* Loading indicator */}
              {loading && (
                <div className={`px-6 py-3 flex items-center gap-3 border-b ${darkMode ? 'border-white/5 text-slate-400' : 'border-gray-100 text-gray-500'}`}>
                  <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Ładowanie...</span>
                </div>
              )}

              {/* ====== FILE LIST VIEW ====== */}
              {viewMode === 'list' ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${darkMode ? 'border-white/5' : 'border-gray-100'}`}>
                        <th className={`text-left p-4 text-[11px] font-bold uppercase tracking-widest cursor-pointer transition-colors ${darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'}`} onClick={() => handleSort('name')}>
                          <div className="flex items-center gap-2">Nazwa <span className={`text-xs ${sortBy === 'name' ? (darkMode ? 'text-indigo-400' : 'text-indigo-500') : ''}`}>{getSortIcon('name')}</span></div>
                        </th>
                        <th className={`text-left p-4 text-[11px] font-bold uppercase tracking-widest hidden sm:table-cell cursor-pointer transition-colors ${darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'}`} onClick={() => handleSort('size')}>
                          <div className="flex items-center gap-2">Rozmiar <span className={`text-xs ${sortBy === 'size' ? (darkMode ? 'text-indigo-400' : 'text-indigo-500') : ''}`}>{getSortIcon('size')}</span></div>
                        </th>
                        <th className={`text-right p-4 text-[11px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Akcje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedFiles.length === 0 && !loading ? (
                        <tr>
                          <td colSpan="3" className="p-12 text-center">
                            <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                              <span className="text-4xl">{searchQuery ? '🔍' : '📭'}</span>
                            </div>
                            <p className={`font-medium ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                              {searchQuery ? `Nie znaleziono plików dla "${searchQuery}"` : 'Brak plików w tym katalogu'}
                            </p>
                            <p className={`text-sm mt-1 ${darkMode ? 'text-slate-600' : 'text-gray-400'}`}>
                              {searchQuery ? 'Spróbuj innej frazy' : 'Prześlij pierwszy plik lub utwórz folder'}
                            </p>
                            {searchQuery && <button onClick={() => setSearchQuery('')} className="mt-3 text-indigo-500 hover:text-indigo-400 text-sm font-medium">Wyczyść wyszukiwanie</button>}
                          </td>
                        </tr>
                      ) : (
                        filteredAndSortedFiles.map((file, index) => (
                          <tr
                            key={file.id || file.name}
                            className={`border-b transition-all row-hover animate-fade-in stagger-${Math.min(index + 1, 10)} ${
                              darkMode
                                ? `border-white/5 hover:bg-white/[0.03] ${selectedFile === index ? 'bg-indigo-500/10 border-indigo-500/20' : ''}`
                                : `border-gray-50 hover:bg-indigo-50/50 ${selectedFile === index ? 'bg-indigo-50 border-indigo-200/50' : ''}`
                            } cursor-pointer`}
                            onClick={() => setSelectedFile(index)}
                            onDoubleClick={() => file.type === 'dir' && navigateToFolder(file.name, file.id)}
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-transform hover:scale-110 ${file.type === 'dir' ? (darkMode ? 'bg-amber-500/15' : 'bg-amber-100') : (darkMode ? 'bg-indigo-500/15' : 'bg-indigo-100')}`}>
                                  {getFileIcon(file)}
                                </div>
                                <div className="min-w-0">
                                  {file.type === 'dir' ? (
                                    <button className={`font-semibold text-left hover:underline truncate block ${darkMode ? 'text-amber-300 hover:text-amber-200' : 'text-amber-600 hover:text-amber-700'}`} onClick={(e) => { e.stopPropagation(); navigateToFolder(file.name, file.id); }}>
                                      {file.name}
                                    </button>
                                  ) : (
                                    <p className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}>{file.name}</p>
                                  )}
                                  <p className={`text-xs sm:hidden mt-0.5 ${darkMode ? 'text-slate-600' : 'text-gray-400'}`}>{formatSize(file.bytes)}</p>
                                </div>
                              </div>
                            </td>
                            <td className={`p-4 hidden sm:table-cell text-sm ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>{formatSize(file.bytes)}</td>
                            <td className="p-4">
                              <div className="flex items-center justify-end gap-0.5">
                                {file.type === 'file' && (
                                  <button className={`p-2 rounded-lg transition-all group btn-press ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`} title="Pobierz" onClick={(e) => handleDownload(file, e)}>
                                    <svg className={`w-4 h-4 ${darkMode ? 'text-slate-500 group-hover:text-indigo-400' : 'text-gray-400 group-hover:text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                  </button>
                                )}
                                {file.type === 'dir' && (
                                  <button className={`p-2 rounded-lg transition-all group btn-press ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`} title="Pobierz jako ZIP" onClick={(e) => handleDownloadDirectory(file, e)}>
                                    <svg className={`w-4 h-4 ${darkMode ? 'text-slate-500 group-hover:text-indigo-400' : 'text-gray-400 group-hover:text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                  </button>
                                )}
                                <button className={`p-2 rounded-lg transition-all group btn-press ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`} title="Zmień nazwę" onClick={(e) => handleRenameClick(file, e)}>
                                  <svg className={`w-4 h-4 ${darkMode ? 'text-slate-500 group-hover:text-amber-400' : 'text-gray-400 group-hover:text-amber-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                <button className={`p-2 rounded-lg transition-all group btn-press ${darkMode ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`} title="Usuń" onClick={(e) => handleDeleteClick(file, index, e)}>
                                  <svg className={`w-4 h-4 ${darkMode ? 'text-slate-500 group-hover:text-red-400' : 'text-gray-400 group-hover:text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* ====== GRID VIEW ====== */
                <div className="p-5 sm:p-6">
                  {filteredAndSortedFiles.length === 0 && !loading ? (
                    <div className="p-12 text-center">
                      <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                        <span className="text-4xl">{searchQuery ? '🔍' : '📭'}</span>
                      </div>
                      <p className={`font-medium ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        {searchQuery ? `Nie znaleziono plików dla "${searchQuery}"` : 'Brak plików w tym katalogu'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {filteredAndSortedFiles.map((file, index) => (
                        <div
                          key={file.id || file.name}
                          className={`group relative p-4 rounded-2xl border transition-all cursor-pointer grid-card-hover animate-fade-in stagger-${Math.min(index + 1, 10)} ${
                            darkMode
                              ? `border-white/5 hover:border-white/10 hover:bg-white/5 ${selectedFile === index ? 'bg-indigo-500/10 border-indigo-500/20' : ''}`
                              : `border-gray-100 hover:border-gray-200 hover:bg-white hover:shadow-lg ${selectedFile === index ? 'bg-indigo-50 border-indigo-200' : ''}`
                          }`}
                          onClick={() => setSelectedFile(index)}
                          onDoubleClick={() => file.type === 'dir' && navigateToFolder(file.name, file.id)}
                        >
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                            {file.type === 'file' && (
                              <button className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-indigo-400' : 'bg-white/80 hover:bg-gray-100 text-gray-400 hover:text-indigo-600'}`} title="Pobierz" onClick={(e) => handleDownload(file, e)}>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                              </button>
                            )}
                            {file.type === 'dir' && (
                              <button className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-indigo-400' : 'bg-white/80 hover:bg-gray-100 text-gray-400 hover:text-indigo-600'}`} title="Pobierz jako ZIP" onClick={(e) => handleDownloadDirectory(file, e)}>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                              </button>
                            )}
                            <button className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-amber-400' : 'bg-white/80 hover:bg-gray-100 text-gray-400 hover:text-amber-600'}`} title="Zmień nazwę" onClick={(e) => handleRenameClick(file, e)}>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400' : 'bg-white/80 hover:bg-red-50 text-gray-400 hover:text-red-500'}`} title="Usuń" onClick={(e) => handleDeleteClick(file, index, e)}>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                          <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-2xl mb-3 transition-transform group-hover:scale-110 ${file.type === 'dir' ? (darkMode ? 'bg-amber-500/15' : 'bg-amber-100') : (darkMode ? 'bg-indigo-500/15' : 'bg-indigo-100')}`}>
                            {getFileIcon(file)}
                          </div>
                          <p className={`text-sm font-medium text-center truncate ${file.type === 'dir' ? (darkMode ? 'text-amber-300' : 'text-amber-600') : (darkMode ? 'text-white' : 'text-gray-800')}`}>{file.name}</p>
                          <p className={`text-[10px] text-center mt-1 ${darkMode ? 'text-slate-600' : 'text-gray-400'}`}>{file.type === 'dir' ? 'Katalog' : formatSize(file.bytes)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className={`px-5 sm:px-6 py-4 border-t flex items-center justify-between text-xs font-medium ${darkMode ? 'border-white/5 text-slate-600' : 'border-gray-100 text-gray-400'}`}>
                <span>{filteredAndSortedFiles.length} {filteredAndSortedFiles.length === 1 ? 'element' : 'elementów'}{searchQuery && ` (z ${files.length})`}</span>
                <span>{formatSize(totalUsed)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ============ FOOTER ============ */}
      <footer className={`relative z-10 mt-8 border-t transition-colors duration-500 ${darkMode ? 'border-white/5' : 'border-gray-200/50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
              </div>
              <span className={`text-sm font-semibold ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>CloudDrive</span>
            </div>
            <p className={`text-xs ${darkMode ? 'text-slate-600' : 'text-gray-400'}`}>© 2025 CloudDrive. Wszystkie prawa zastrzeżone.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
