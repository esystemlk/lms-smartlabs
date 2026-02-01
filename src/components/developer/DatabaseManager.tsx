"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc, query, limit, orderBy, startAfter, DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { Loader2, Trash2, RefreshCw, ChevronRight, ChevronLeft, Database } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const KNOWN_COLLECTIONS = [
  "users",
  "courses",
  "batches",
  "recordings", // New collection for Bunny.net recordings
  "settings",
  "notifications"
];

export function DatabaseManager() {
  const { toast } = useToast();
  const [selectedCollection, setSelectedCollection] = useState("users");
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  
  const fetchDocuments = async (reset = true) => {
    setLoading(true);
    try {
      let q = query(collection(db, selectedCollection), limit(20));
      
      // Basic pagination (next only for now)
      if (!reset && lastDoc) {
        q = query(collection(db, selectedCollection), startAfter(lastDoc), limit(20));
      }

      const snapshot = await getDocs(q);
      
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (reset) {
        setDocuments(docs);
      } else {
        setDocuments(prev => [...prev, ...docs]);
      }
      
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast(`Failed to fetch ${selectedCollection}`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(true);
  }, [selectedCollection]);

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete document ${id}? This action cannot be undone.`)) return;

    try {
      await deleteDoc(doc(db, selectedCollection, id));
      toast("Document deleted", "success");
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (error) {
      console.error("Error deleting document:", error);
      toast("Failed to delete document", "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-purple-600" />
          <select 
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="font-mono text-sm bg-gray-50 border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
          >
            {KNOWN_COLLECTIONS.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        
        <button 
          onClick={() => fetchDocuments(true)} 
          className="p-2 hover:bg-gray-100 rounded-lg"
          disabled={loading}
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-700">ID</th>
                <th className="px-4 py-3 font-medium text-gray-700">Data Preview</th>
                <th className="px-4 py-3 font-medium text-gray-700 w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap max-w-[150px] truncate">
                    {doc.id}
                  </td>
                  <td className="px-4 py-3">
                    <pre className="text-xs text-gray-600 overflow-hidden max-h-20 max-w-xl whitespace-pre-wrap">
                      {JSON.stringify(doc, null, 2)}
                    </pre>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Delete Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              
              {!loading && documents.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                    No documents found in '{selectedCollection}'
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {lastDoc && (
          <div className="p-4 border-t flex justify-center">
            <button
              onClick={() => fetchDocuments(false)}
              disabled={loading}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load More"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
