import React, { useState } from 'react';
import { HelpCircle, ChevronRight, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SettingsRow } from './SettingsLayout';

const FAQ_DATA = [
  { id: '1', question: 'How do recommendations work?', answer: 'Atlas uses an algorithm based on spaced repetition, your past scores, and syllabus completion to suggest what to study next.' },
  { id: '2', question: 'Is my data backed up?', answer: 'Yes, your data is securely stored and synced via Firebase.' },
  { id: '3', question: 'How can I renew beta access?', answer: 'As Atlas evolves, early members will be transitioned to the full release automatically.' }
];

export function FaqSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  const toggleItem = (id: string) => {
    setOpenIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      <SettingsRow
        icon={HelpCircle}
        label="Help & FAQ"
        control={<ChevronRight className="w-4 h-4 text-muted-foreground" />}
        onClick={() => setModalOpen(true)}
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-zinc-800 text-zinc-100 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-white flex items-center gap-2">
              <HelpCircle className="w-4.5 h-4.5 text-primary" />
              Help & FAQ
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {FAQ_DATA.map(item => {
              const isOpen = !!openIds[item.id];
              return (
                <div key={item.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden transition-colors">
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className="w-full flex items-center justify-between p-3 text-left text-xs font-semibold text-zinc-100 hover:bg-zinc-800/50 transition-colors gap-3 cursor-pointer"
                  >
                    <span className="truncate">{item.question}</span>
                    <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-3.5 pb-3.5 pt-1 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800 bg-zinc-900/20 animate-in fade-in slide-in-from-top-1 duration-150">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
