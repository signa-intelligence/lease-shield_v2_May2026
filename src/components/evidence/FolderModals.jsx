import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertTriangle } from "lucide-react";

export function CreateFolderModal({ open, onClose, folderName, setFolderName, onCreate, creating, colors, strings }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
        <DialogHeader>
          <DialogTitle style={{ color: colors.textPrimary }}>{strings.createFolder}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label style={{ color: colors.textPrimary }}>{strings.folderName}</Label>
            <Input
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder={strings.folderNamePlaceholder}
              maxLength={50}
              className="mt-2"
              style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
              onKeyDown={(e) => { if (e.key === 'Enter' && folderName.trim()) onCreate(); }}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>{strings.cancel}</Button>
            <Button
              onClick={onCreate}
              disabled={!folderName.trim() || creating}
              style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {strings.create}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RenameFolderModal({ open, onClose, folderName, setFolderName, onRename, renaming, colors, strings }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
        <DialogHeader>
          <DialogTitle style={{ color: colors.textPrimary }}>{strings.renameFolder}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label style={{ color: colors.textPrimary }}>{strings.folderName}</Label>
            <Input
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              maxLength={50}
              className="mt-2"
              style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}
              onKeyDown={(e) => { if (e.key === 'Enter' && folderName.trim()) onRename(); }}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>{strings.cancel}</Button>
            <Button
              onClick={onRename}
              disabled={!folderName.trim() || renaming}
              style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
            >
              {renaming ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {strings.rename}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteFolderModal({ open, onClose, folder, fileCount, onDelete, deleting, colors, strings }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
        <DialogHeader>
          <DialogTitle style={{ color: colors.textPrimary }}>{strings.deleteConfirm}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <p className="text-sm" style={{ color: colors.textPrimary }}>
            "{folder?.folder_name}"
          </p>
          {fileCount > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}>
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                {fileCount} {strings.deleteWarning}
              </p>
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>{strings.cancel}</Button>
            <Button
              onClick={onDelete}
              disabled={deleting}
              variant="destructive"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {strings.deleteFolderBtn}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MoveToFolderModal({ open, onClose, folders, selectedFolderId, setSelectedFolderId, onMove, moving, colors, strings }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
        <DialogHeader>
          <DialogTitle style={{ color: colors.textPrimary }}>{strings.moveToFolder}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Select value={selectedFolderId || "__root__"} onValueChange={(v) => setSelectedFolderId(v === "__root__" ? null : v)}>
              <SelectTrigger style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor, color: colors.textPrimary }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: colors.cardBg, color: colors.textPrimary }}>
                <SelectItem value="__root__">📂 {strings.rootNoFolder}</SelectItem>
                {folders.map(f => (
                  <SelectItem key={f.id} value={f.id}>📁 {f.folder_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>{strings.cancel}</Button>
            <Button
              onClick={onMove}
              disabled={moving}
              style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF' }}
            >
              {moving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {strings.move}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}