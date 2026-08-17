import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function SaveBlueprintDialog({ open, onOpenChange, onSave, saving, defaults }) {
  const [name, setName] = useState(defaults?.name || "");
  const [author, setAuthor] = useState(defaults?.author_name || "");
  const [role, setRole] = useState(defaults?.role || "");
  const [description, setDescription] = useState(defaults?.description || "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-primary/30">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-widest">Register Blueprint</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="tech-label">Designation *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. VANGUARD MK.II" className="rounded-none font-mono mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="tech-label">Engineer</Label>
              <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Callsign" className="rounded-none font-mono mt-1" />
            </div>
            <div>
              <Label className="tech-label">Role</Label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Brawler, Miner" className="rounded-none font-mono mt-1" />
            </div>
          </div>
          <div>
            <Label className="tech-label">Notes</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Doctrine, strengths, weaknesses..." className="rounded-none mt-1" rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-none" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            className="rounded-none font-display uppercase tracking-wider"
            disabled={!name.trim() || saving}
            onClick={() => onSave({ name: name.trim(), author_name: author.trim(), role: role.trim(), description })}
          >
            {saving ? "Registering..." : "Save Blueprint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}