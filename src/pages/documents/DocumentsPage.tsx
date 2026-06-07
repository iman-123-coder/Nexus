import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Download, Trash2, Share2, PenLine, X, Loader } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

interface DocUser { _id: string; name: string; email: string; }
interface Document {
  _id: string;
  title: string;
  filename: string;
  filepath: string;
  filesize: number;
  mimetype: string;
  isSigned: boolean;
  sharedWith: DocUser[];
  owner: DocUser;
  createdAt: string;
}

export const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'mine' | 'shared'>('all');
  const [signingDocId, setSigningDocId] = useState<string | null>(null);
  const [shareDocId, setShareDocId] = useState<string | null>(null);
  const [shareUserId, setShareUserId] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => { fetchDocuments(); }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/documents');
      setDocuments(data.documents);
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('document', file);
    formData.append('title', file.name);
    try {
      setUploading(true);
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Document uploaded!');
      fetchDocuments();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await api.delete(`/documents/${id}`);
      toast.success('Document deleted');
      setDocuments(prev => prev.filter(d => d._id !== id));
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleShare = async (id: string) => {
    if (!shareUserId.trim()) return;
    try {
      await api.put(`/documents/${id}/share`, { userId: shareUserId });
      toast.success('Document shared!');
      setShareDocId(null);
      setShareUserId('');
      fetchDocuments();
    } catch {
      toast.error('Share failed — check the user ID');
    }
  };

  const handleDownload = (doc: Document) => {
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const url = `${baseUrl}/${doc.filepath.replace(/\\/g, '/')}`;
    window.open(url, '_blank');
  };

  // Canvas signature drawing
  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const rect = canvasRef.current!.getBoundingClientRect();
    lastPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current || !lastPos.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    lastPos.current = { x, y };
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const submitSignature = async () => {
    if (!canvasRef.current || !signingDocId) return;
    const signature = canvasRef.current.toDataURL('image/png');
    try {
      await api.put(`/documents/${signingDocId}/sign`, { signature });
      toast.success('Document signed!');
      setSigningDocId(null);
      fetchDocuments();
    } catch {
      toast.error('Signing failed');
    }
  };

  const filteredDocs = documents.filter(doc => {
    if (activeFilter === 'mine') return doc.owner._id === user?.id;
    if (activeFilter === 'shared') return doc.sharedWith.some(u => u._id === user?.id);
    return true;
  });

  const formatSize = (bytes: number) => {
    if (!bytes) return '—';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Manage and share your important files</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            onChange={handleUpload}
          />
          <Button
            leftIcon={uploading ? <Loader size={18} className="animate-spin" /> : <Upload size={18} />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'mine', 'shared'] as const).map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
              activeFilter === f
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? 'All Documents' : f === 'mine' ? 'My Documents' : 'Shared with Me'}
          </button>
        ))}
      </div>

      {/* Document list */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">
            {filteredDocs.length} Document{filteredDocs.length !== 1 ? 's' : ''}
          </h2>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader size={32} className="animate-spin text-primary-600" />
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText size={48} className="mx-auto mb-3 text-gray-300" />
              <p>No documents found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocs.map(doc => (
                <div
                  key={doc._id}
                  className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="p-2 bg-primary-50 rounded-lg mr-4">
                    <FileText size={24} className="text-primary-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{doc.title}</h3>
                      {doc.isSigned && <Badge variant="success" size="sm">Signed</Badge>}
                      {doc.sharedWith.length > 0 && <Badge variant="secondary" size="sm">Shared</Badge>}
                      {doc.owner._id !== user?.id && <Badge variant="primary" size="sm">From {doc.owner.name}</Badge>}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span>{formatSize(doc.filesize)}</span>
                      <span>{doc.mimetype}</span>
                      <span>Uploaded {formatDate(doc.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-4">
                    <Button variant="ghost" size="sm" className="p-2" onClick={() => handleDownload(doc)} aria-label="Download">
                      <Download size={16} />
                    </Button>
                    {doc.owner._id === user?.id && (
                      <>
                        <Button variant="ghost" size="sm" className="p-2" onClick={() => setShareDocId(doc._id)} aria-label="Share">
                          <Share2 size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-2" onClick={() => setSigningDocId(doc._id)} aria-label="Sign">
                          <PenLine size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-2 text-red-600 hover:text-red-700" onClick={() => handleDelete(doc._id)} aria-label="Delete">
                          <Trash2 size={16} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Share Modal */}
      {shareDocId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Share Document</h3>
              <button onClick={() => setShareDocId(null)}><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-600 mb-3">Enter the User ID of the person to share with</p>
            <input
              type="text"
              placeholder="Paste user ID here..."
              value={shareUserId}
              onChange={e => setShareUserId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShareDocId(null)}>Cancel</Button>
              <Button onClick={() => handleShare(shareDocId)}>Share</Button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {signingDocId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sign Document</h3>
              <button onClick={() => setSigningDocId(null)}><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-600 mb-3">Draw your signature below</p>
            <canvas
              ref={canvasRef}
              width={460}
              height={160}
              className="border-2 border-dashed border-gray-300 rounded-lg w-full cursor-crosshair bg-gray-50"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={() => setIsDrawing(false)}
              onMouseLeave={() => setIsDrawing(false)}
            />
            <div className="flex gap-3 justify-end mt-4">
              <Button variant="outline" onClick={clearCanvas}>Clear</Button>
              <Button variant="outline" onClick={() => setSigningDocId(null)}>Cancel</Button>
              <Button onClick={submitSignature}>Apply Signature</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};