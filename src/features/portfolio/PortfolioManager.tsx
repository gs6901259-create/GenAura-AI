import React, { useState } from 'react';
import type { Creator, PortfolioItem } from '@/types';
import { useAppStore } from '@/lib/store';
import { PortfolioGallery } from './PortfolioGallery';
import { PortfolioForm } from './PortfolioForm';
import { Button } from '@/components/ui';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export interface PortfolioManagerProps {
  creator: Creator;
}

export const PortfolioManager: React.FC<PortfolioManagerProps> = ({ creator }) => {
  const { portfolios, addPortfolio, updatePortfolio, removePortfolio } = useAppStore();
  const creatorItems = portfolios.filter((p) => p.creatorId === creator.id);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | undefined>(undefined);
  const [deletingItem, setDeletingItem] = useState<PortfolioItem | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingItem(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: PortfolioItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleSave = (item: PortfolioItem) => {
    if (editingItem) {
      updatePortfolio(item.id, item);
      notify(`Project "${item.title}" updated successfully.`);
    } else {
      addPortfolio(item);
      notify(`Project "${item.title}" added to portfolio.`);
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    removePortfolio(deletingItem.id);
    notify(`Project "${deletingItem.title}" was removed.`);
    setDeletingItem(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toast Notification */}
      {notification && (
        <div
          role="status"
          className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-medium animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Gallery with owner capabilities */}
      <PortfolioGallery
        items={creatorItems}
        creatorName={creator.name}
        isOwner={true}
        onAddItem={handleOpenAdd}
        onEditItem={handleOpenEdit}
        onDeleteItem={(item) => setDeletingItem(item)}
      />

      {/* Form Modal */}
      {isFormOpen && (
        <PortfolioForm
          creatorId={creator.id}
          initialItem={editingItem}
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirmation Alert Dialog */}
      {deletingItem && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingItem(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-navy-900 border border-rose-500/40 p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle size={24} />
              <h3 id="confirm-delete-title" className="text-lg font-bold text-navy-50">
                Delete Portfolio Project?
              </h3>
            </div>
            <p className="text-sm text-navy-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">"{deletingItem.title}"</strong>? This will remove the asset from your public portfolio gallery.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setDeletingItem(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleConfirmDelete}>
                Delete Item
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
