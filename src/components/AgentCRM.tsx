import { useState, useEffect } from "react";
import { crmService, CRMLead, CRMStage, STAGE_CONFIG, STAGE_ORDER } from "@/services/crmService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Loader2, Plus, ChevronRight, ChevronLeft,
    Trash2, Phone, Mail, Home, X, StickyNote
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AgentCRMProps {
    agentId: string;
}

const AgentCRM = ({ agentId }: AgentCRMProps) => {
    const { toast } = useToast();
    const [leads, setLeads] = useState<CRMLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [notes, setNotes] = useState("");
    const [savingNotes, setSavingNotes] = useState(false);
    const [filterStage, setFilterStage] = useState<CRMStage | "all">("all");

    const [addForm, setAddForm] = useState({
        tenantName: "",
        tenantPhone: "",
        tenantEmail: "",
        stage: "new" as CRMStage,
    });

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const data = await crmService.getLeads(agentId);
            setLeads(data);
            setLoading(false);
        };
        fetch();
    }, [agentId]);

    const handleMoveStage = async (lead: CRMLead, direction: "forward" | "back") => {
        const currentIndex = STAGE_ORDER.indexOf(lead.stage);
        const nextIndex = direction === "forward" ? currentIndex + 1 : currentIndex - 1;
        if (nextIndex < 0 || nextIndex >= STAGE_ORDER.length) return;

        const newStage = STAGE_ORDER[nextIndex];
        setUpdatingId(lead.id);
        const success = await crmService.updateStage(lead.id, newStage);
        if (success) {
            setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, stage: newStage } : l));
            if (selectedLead?.id === lead.id) setSelectedLead((prev) => prev ? { ...prev, stage: newStage } : null);
            toast({ title: `Moved to ${STAGE_CONFIG[newStage].label}` });
        }
        setUpdatingId(null);
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        const success = await crmService.deleteLead(id);
        if (success) {
            setLeads((prev) => prev.filter((l) => l.id !== id));
            if (selectedLead?.id === id) setSelectedLead(null);
            toast({ title: "Lead removed" });
        }
        setDeletingId(null);
    };

    const handleSaveNotes = async () => {
        if (!selectedLead) return;
        setSavingNotes(true);
        const success = await crmService.updateNotes(selectedLead.id, notes);
        if (success) {
            setLeads((prev) => prev.map((l) => l.id === selectedLead.id ? { ...l, notes } : l));
            setSelectedLead((prev) => prev ? { ...prev, notes } : null);
            toast({ title: "Notes saved ✓" });
        }
        setSavingNotes(false);
    };

    const handleAddLead = async () => {
        if (!addForm.tenantName) {
            toast({ title: "Tenant name is required", variant: "destructive" });
            return;
        }
        const lead = await crmService.createLead({
            agentId,
            tenantName: addForm.tenantName,
            tenantPhone: addForm.tenantPhone,
            tenantEmail: addForm.tenantEmail,
            stage: addForm.stage,
        });
        if (lead) {
            setLeads((prev) => [lead, ...prev]);
            setAddForm({ tenantName: "", tenantPhone: "", tenantEmail: "", stage: "new" });
            setShowAddForm(false);
            toast({ title: "Lead added ✓" });
        }
    };

    const openLead = (lead: CRMLead) => {
        setSelectedLead(lead);
        setNotes(lead.notes ?? "");
    };

    const filteredLeads = filterStage === "all"
        ? leads
        : leads.filter((l) => l.stage === filterStage);

    // Stage counts for the filter pills
    const stageCounts = STAGE_ORDER.reduce((acc, stage) => {
        acc[stage] = leads.filter((l) => l.stage === stage).length;
        return acc;
    }, {} as Record<CRMStage, number>);

    if (loading) return (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading leads...
        </div>
    );

    return (
        <div className="space-y-5">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-display text-xl font-bold">Lead Pipeline</h2>
                    <p className="text-sm text-muted-foreground">{leads.length} total lead{leads.length !== 1 ? "s" : ""}</p>
                </div>
                <Button size="sm" onClick={() => setShowAddForm(true)}>
                    <Plus className="mr-1 h-4 w-4" /> Add Lead
                </Button>
            </div>

            {/* Stage filter pills */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                    onClick={() => setFilterStage("all")}
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${filterStage === "all" ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"
                        }`}
                >
                    All ({leads.length})
                </button>
                {STAGE_ORDER.map((stage) => {
                    const config = STAGE_CONFIG[stage];
                    const count = stageCounts[stage];
                    return (
                        <button
                            key={stage}
                            onClick={() => setFilterStage(stage)}
                            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${filterStage === stage
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : `${config.bg} ${config.color}`
                                }`}
                        >
                            {config.label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Add Lead Form */}
            {showAddForm && (
                <div className="rounded-xl border bg-card p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Add New Lead</h3>
                        <button onClick={() => setShowAddForm(false)}>
                            <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 space-y-1">
                            <Label>Tenant Name *</Label>
                            <Input
                                placeholder="Full name"
                                value={addForm.tenantName}
                                onChange={(e) => setAddForm((p) => ({ ...p, tenantName: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Phone</Label>
                            <Input
                                placeholder="+234 000 000 0000"
                                value={addForm.tenantPhone}
                                onChange={(e) => setAddForm((p) => ({ ...p, tenantPhone: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Email</Label>
                            <Input
                                placeholder="email@example.com"
                                value={addForm.tenantEmail}
                                onChange={(e) => setAddForm((p) => ({ ...p, tenantEmail: e.target.value }))}
                            />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <Label>Stage</Label>
                            <select
                                value={addForm.stage}
                                onChange={(e) => setAddForm((p) => ({ ...p, stage: e.target.value as CRMStage }))}
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                {STAGE_ORDER.map((s) => (
                                    <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setShowAddForm(false)}>Cancel</Button>
                        <Button className="flex-1" onClick={handleAddLead}>Add Lead</Button>
                    </div>
                </div>
            )}

            {/* Leads List + Detail Panel */}
            <div className={`grid gap-4 ${selectedLead ? "lg:grid-cols-2" : ""}`}>

                {/* Leads List */}
                <div className="space-y-3">
                    {filteredLeads.length === 0 ? (
                        <div className="rounded-xl border border-dashed bg-card p-10 text-center text-muted-foreground">
                            <Plus className="mx-auto mb-3 h-8 w-8 opacity-30" />
                            <p className="font-medium">No leads yet</p>
                            <p className="text-sm">Add a lead manually or they'll appear automatically when tenants book through your storefront</p>
                        </div>
                    ) : (
                        filteredLeads.map((lead) => {
                            const config = STAGE_CONFIG[lead.stage];
                            const stageIndex = STAGE_ORDER.indexOf(lead.stage);
                            return (
                                <div
                                    key={lead.id}
                                    onClick={() => openLead(lead)}
                                    className={`rounded-xl border bg-card p-4 cursor-pointer transition-all hover:shadow-md ${selectedLead?.id === lead.id ? "ring-2 ring-primary" : ""
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{lead.tenantName}</p>
                                            {lead.propertyTitle && (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <Home className="h-3 w-3 shrink-0" />
                                                    <span className="truncate">{lead.propertyTitle}</span>
                                                </p>
                                            )}
                                            {lead.tenantPhone && (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <Phone className="h-3 w-3 shrink-0" />{lead.tenantPhone}
                                                </p>
                                            )}
                                        </div>

                                        {/* Stage badge */}
                                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${config.bg} ${config.color}`}>
                                            {config.label}
                                        </span>
                                    </div>

                                    {/* Stage navigation */}
                                    <div className="mt-3 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => handleMoveStage(lead, "back")}
                                            disabled={stageIndex === 0 || updatingId === lead.id}
                                            className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                                        >
                                            <ChevronLeft className="h-3 w-3" /> Back
                                        </button>

                                        {/* Progress bar */}
                                        <div className="flex-1 flex gap-0.5">
                                            {STAGE_ORDER.slice(0, -1).map((s, i) => (
                                                <div
                                                    key={s}
                                                    className={`h-1 flex-1 rounded-full ${i <= stageIndex && lead.stage !== "lost"
                                                            ? "bg-primary"
                                                            : "bg-muted"
                                                        }`}
                                                />
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => handleMoveStage(lead, "forward")}
                                            disabled={stageIndex === STAGE_ORDER.length - 1 || updatingId === lead.id}
                                            className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                                        >
                                            {updatingId === lead.id
                                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                                : <>Next <ChevronRight className="h-3 w-3" /></>
                                            }
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Lead Detail Panel */}
                {selectedLead && (
                    <div className="rounded-xl border bg-card p-5 space-y-4 self-start sticky top-24">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Lead Details</h3>
                            <button onClick={() => setSelectedLead(null)}>
                                <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                        </div>

                        {/* Contact info */}
                        <div className="space-y-2">
                            <p className="font-medium text-lg">{selectedLead.tenantName}</p>
                            {selectedLead.tenantPhone && (
                                <a href={`tel:${selectedLead.tenantPhone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                                    <Phone className="h-3.5 w-3.5" />{selectedLead.tenantPhone}
                                </a>
                            )}
                            {selectedLead.tenantEmail && (
                                <a href={`mailto:${selectedLead.tenantEmail}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                                    <Mail className="h-3.5 w-3.5" />{selectedLead.tenantEmail}
                                </a>
                            )}
                            {selectedLead.propertyTitle && (
                                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Home className="h-3.5 w-3.5" />{selectedLead.propertyTitle}
                                </p>
                            )}
                        </div>

                        {/* Current stage */}
                        <div>
                            <p className="text-xs text-muted-foreground mb-2">Current Stage</p>
                            <div className="grid grid-cols-3 gap-1.5">
                                {STAGE_ORDER.map((stage) => {
                                    const config = STAGE_CONFIG[stage];
                                    const isActive = selectedLead.stage === stage;
                                    return (
                                        <button
                                            key={stage}
                                            onClick={async () => {
                                                setUpdatingId(selectedLead.id);
                                                const success = await crmService.updateStage(selectedLead.id, stage);
                                                if (success) {
                                                    setLeads((prev) => prev.map((l) => l.id === selectedLead.id ? { ...l, stage } : l));
                                                    setSelectedLead((prev) => prev ? { ...prev, stage } : null);
                                                }
                                                setUpdatingId(null);
                                            }}
                                            disabled={updatingId === selectedLead.id}
                                            className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-all ${isActive
                                                    ? `${config.bg} ${config.color} ring-1 ring-offset-1`
                                                    : "border-border hover:bg-muted text-muted-foreground"
                                                }`}
                                        >
                                            {config.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                                <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">Notes</p>
                            </div>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={4}
                                placeholder="Add notes about this lead..."
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            <Button size="sm" className="w-full" onClick={handleSaveNotes} disabled={savingNotes}>
                                {savingNotes ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Saving...</> : "Save Notes"}
                            </Button>
                        </div>

                        {/* Delete */}
                        <button
                            onClick={() => handleDelete(selectedLead.id)}
                            disabled={deletingId === selectedLead.id}
                            className="flex items-center gap-1.5 text-xs text-destructive hover:underline mx-auto"
                        >
                            {deletingId === selectedLead.id
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <Trash2 className="h-3 w-3" />
                            }
                            Remove lead
                        </button>
                    </div>
                )}
            </div>

        </div>
    );
};

export default AgentCRM;