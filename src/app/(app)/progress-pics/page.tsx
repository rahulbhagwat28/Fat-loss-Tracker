"use client";

import { useEffect, useState, useRef } from "react";

const PER_PAGE = 25;

type ProgressPic = {
  id: string;
  imageUrl: string;
  label: string | null;
  createdAt: string;
};

export default function ProgressPicsPage() {
  const [pics, setPics] = useState<ProgressPic[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPics = async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/progress-pics?page=${pageNum}&limit=${PER_PAGE}`);
      if (res.ok) {
        const data = await res.json();
        setPics(data.pics || []);
        setTotal(data.total ?? 0);
        setTotalPages(Math.max(1, data.totalPages ?? 1));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPics(page);
  }, [page]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    const form = new FormData();
    form.append("file", file);
    form.append("type", "progress");
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    if (res.ok) {
      setImageUrl(data.url);
    } else {
      setError(data.error || "Upload failed");
    }
  };

  const handleRemoveSelected = () => {
    setImageUrl("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      setError("Please select or upload a photo");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const res = await fetch("/api/progress-pics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: imageUrl.trim(), label: label.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add");
      setImageUrl("");
      setLabel("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setPage(1);
      fetchPics(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this progress pic?")) return;
    const res = await fetch(`/api/progress-pics/${id}`, { method: "DELETE" });
    if (res.ok) {
      const newTotal = total - 1;
      const newTotalPages = Math.max(1, Math.ceil(newTotal / PER_PAGE));
      if (page > newTotalPages) setPage(newTotalPages);
      fetchPics(page > newTotalPages ? newTotalPages : page);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white mb-6 whitespace-nowrap">
        Progress Pics
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-surface-card border border-surface-border rounded-2xl p-4 mb-6"
      >
        <p className="text-sm text-slate-400 mb-3">Add a new progress pic (e.g. weekly)</p>
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Photo</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="text-sm text-slate-400 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-500 file:text-white file:font-medium"
            />
            {imageUrl && (
              <div className="mt-2 flex items-start gap-2">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                />
                <button
                  type="button"
                  onClick={handleRemoveSelected}
                  className="px-2 py-1 rounded-md border border-red-500/50 text-red-400 hover:bg-red-500/20 text-xs font-medium"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Label (e.g. Week 1)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Week 1"
              className="px-3 py-2 rounded-xl bg-surface-dark border border-surface-border text-white placeholder-slate-500 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            type="submit"
            disabled={uploading || !imageUrl.trim()}
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm disabled:opacity-50"
          >
            {uploading ? "Adding..." : "Add"}
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : pics.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="mb-2">No progress pics yet.</p>
          <p className="text-sm">Upload your first pic above.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pics.map((pic) => (
              <div
                key={pic.id}
                className="bg-surface-card border border-surface-border rounded-xl p-3.5 hover:border-brand-500/40 transition min-w-0"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-surface-dark mb-2.5">
                  <img
                    src={pic.imageUrl}
                    alt={pic.label || "Progress"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm truncate">
                      {pic.label || formatDate(pic.createdAt)}
                    </p>
                    {pic.label && (
                      <p className="text-xs text-slate-500">{formatDate(pic.createdAt)}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(pic.id)}
                    className="px-2 py-1 rounded-md border border-red-500/50 text-red-400 hover:bg-red-500/20 text-xs font-medium flex-shrink-0"
                  >
                    Del
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-sm text-slate-400">
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total} pics ({PER_PAGE} per page)
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg bg-surface-card border border-surface-border text-slate-300 hover:text-white hover:border-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-white font-medium bg-surface-card border border-surface-border rounded-lg min-w-[7rem] text-center">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg bg-surface-card border border-surface-border text-slate-300 hover:text-white hover:border-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
