'use client'
import { useState, useEffect, useRef } from "react";
import { Plus, Settings, Copy, Trash2, RefreshCw, Upload, Sparkles, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  getDocuments,
  uploadDocument,
  deleteDocument,
  reindexDocuments,
  type DocumentItem,
} from "@/services/api";
import { toast } from "sonner";

interface KnowledgeContext {
  id: string;
  name: string;
  prompt: string;
  openingIntro: string;
  contextUrl: string;
  createdAt: string;
  lastEdit: string;
  documents: DocumentItem[];
}

const KnowledgeBase = () => {
  const [contexts, setContexts] = useState<KnowledgeContext[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("ai-assistant-contexts");
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved) as KnowledgeContext[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [editingContext, setEditingContext] = useState<KnowledgeContext | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem("ai-assistant-contexts", JSON.stringify(contexts));
  }, [contexts]);

  const createNewContext = () => {
    const now = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const newCtx: KnowledgeContext = {
      id: crypto.randomUUID(),
      name: "New Context",
      prompt: "",
      openingIntro: "",
      contextUrl: "",
      createdAt: now,
      lastEdit: now,
      documents: [],
    };
    setEditingContext(newCtx);
    setDialogOpen(true);
  };

  const openContext = (ctx: KnowledgeContext) => {
    setEditingContext({ ...ctx });
    setDialogOpen(true);
  };

  const saveContext = () => {
    if (!editingContext) return;
    const now = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const updated = { ...editingContext, lastEdit: now };
    setContexts((prev) => {
      const exists = prev.find((c) => c.id === updated.id);
      if (exists) return prev.map((c) => (c.id === updated.id ? updated : c));
      return [...prev, updated];
    });
    setDialogOpen(false);
    setEditingContext(null);
    toast.success("Context saved");
  };

  const deleteContext = (id: string) => {
    setContexts((prev) => prev.filter((c) => c.id !== id));
    toast.success("Context deleted");
  };

  const duplicateContext = (ctx: KnowledgeContext) => {
    const now = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const dup: KnowledgeContext = {
      ...ctx,
      id: crypto.randomUUID(),
      name: `${ctx.name} (copy)`,
      createdAt: now,
      lastEdit: now,
    };
    setContexts((prev) => [...prev, dup]);
    toast.success("Context duplicated");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingContext || !e.target.files) return;
    for (const file of Array.from(e.target.files)) {
      try {
        const doc = await uploadDocument(file);
        setEditingContext((prev) =>
          prev ? { ...prev, documents: [...prev.documents, doc] } : prev
        );
        toast.success(`Uploaded ${file.name}`);
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      await deleteDocument(docId);
      setEditingContext((prev) =>
        prev ? { ...prev, documents: prev.documents.filter((d) => d.id !== docId) } : prev
      );
      toast.success("Document removed");
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleReindex = async () => {
    setIsReindexing(true);
    try {
      await reindexDocuments();
      toast.success("Re-indexing started");
    } catch {
      toast.error("Re-index failed");
    } finally {
      setIsReindexing(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-foreground whitespace-nowrap">
            Contexts
            <span className="ml-2 font-normal text-muted-foreground">({contexts.length})</span>
          </h2>
          <Badge variant="outline" className="w-fit shrink-0 font-mono text-xs">
            GET /v1/contexts
            <ExternalLink className="ml-1 h-3 w-3" />
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={handleReindex} disabled={isReindexing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isReindexing ? "animate-spin" : ""}`} />
          Re-index
        </Button>
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Create New card */}
        <button
          onClick={createNewContext}
          className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border hover:border-muted-foreground/40 p-8 transition-colors min-h-[160px] group"
        >
          <div className="h-14 w-14 rounded-full border-2 border-dashed border-muted-foreground/30 group-hover:border-muted-foreground/60 flex items-center justify-center transition-colors">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            Create New
          </span>
        </button>

        {/* Context cards */}
        {contexts.map((ctx) => (
          <div
            key={ctx.id}
            className="rounded-lg border border-border bg-card p-5 flex flex-col justify-between min-h-[160px] shadow-card hover:shadow-card-hover transition-all group relative"
          >
            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); openContext(ctx); }}
                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); duplicateContext(ctx); }}
                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="cursor-pointer" onClick={() => openContext(ctx)}>
              <p className="text-xs text-muted-foreground mb-1">Name</p>
              <p className="font-semibold text-foreground">{ctx.name}</p>
            </div>

            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Creation Date</span>
                <span className="text-foreground">{ctx.createdAt}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Last Edit</span>
                <span className="text-foreground">{ctx.lastEdit}</span>
              </div>
              {ctx.documents.length > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Documents</span>
                  <span className="text-foreground">{ctx.documents.length}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
          {editingContext && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg">{editingContext.name || "New Context"}</DialogTitle>
              </DialogHeader>

              <div className="space-y-5 py-2">
                <div className="space-y-1.5">
                  <Label className="text-sm">Name</Label>
                  <Input
                    value={editingContext.name}
                    onChange={(e) => setEditingContext({ ...editingContext, name: e.target.value })}
                    placeholder="Context name"
                    className="bg-background border-border"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Opening Intro</Label>
                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <Sparkles className="h-3 w-3" />
                      Generate Opening
                    </button>
                  </div>
                  <Textarea
                    value={editingContext.openingIntro}
                    onChange={(e) => setEditingContext({ ...editingContext, openingIntro: e.target.value })}
                    placeholder="Enter an opening intro for the assistant..."
                    className="h-20 resize-none bg-background border-border"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Additional context via URL</Label>
                  <Input
                    value={editingContext.contextUrl}
                    onChange={(e) => setEditingContext({ ...editingContext, contextUrl: e.target.value })}
                    placeholder="We'll summarize an FAQ from the URL you input as additional context"
                    className="bg-background border-border"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Full prompt</Label>
                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <Sparkles className="h-3 w-3" />
                      Write with guidance
                    </button>
                  </div>
                  <Textarea
                    value={editingContext.prompt}
                    onChange={(e) => setEditingContext({ ...editingContext, prompt: e.target.value })}
                    placeholder="Enter the full system prompt..."
                    className="h-44 resize-none bg-background border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Documents</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.md"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    Upload Documents
                  </Button>
                  {editingContext.documents.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {editingContext.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between gap-2 rounded-md bg-secondary/50 px-3 py-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{doc.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={doc.status === "indexed" ? "default" : "secondary"}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {doc.status}
                            </Badge>
                            <button
                              onClick={() => handleDeleteDoc(doc.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    deleteContext(editingContext.id);
                    setDialogOpen(false);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete
                </Button>
                <Button size="sm" onClick={saveContext}>
                  Save
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KnowledgeBase;
