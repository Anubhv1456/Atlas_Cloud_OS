import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Sparkles, BookOpen, Users, ShieldCheck, Lock, LifeBuoy } from 'lucide-react';

interface FaqItem {
  id: string;
  category: string;
  categoryIcon: React.ElementType;
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  // Getting Started
  {
    id: 'gs-1',
    category: 'Getting Started',
    categoryIcon: Sparkles,
    question: 'What is Atlas?',
    answer: 'Atlas is an intelligent study planner for MBBS students that recommends what to study next based on your progress, confidence, revision history, and exam timeline.'
  },
  {
    id: 'gs-2',
    category: 'Getting Started',
    categoryIcon: Sparkles,
    question: 'Who is Atlas built for?',
    answer: 'Atlas is currently designed for MBBS students and medical entrance examinations such as NEET PG, INICET, and FMGE.'
  },
  {
    id: 'gs-3',
    category: 'Getting Started',
    categoryIcon: Sparkles,
    question: 'How long does Closed Beta last?',
    answer: 'Closed Beta access includes 3 months of full access, including all updates released during the beta period.'
  },

  // Recommendations
  {
    id: 'rec-1',
    category: 'Recommendations',
    categoryIcon: BookOpen,
    question: 'How does Atlas decide what I should study next?',
    answer: 'Atlas continuously evaluates multiple learning signals including revision history, confidence levels, subject priority, and exam proximity to recommend where your next study session will have the greatest impact.'
  },
  {
    id: 'rec-2',
    category: 'Recommendations',
    categoryIcon: BookOpen,
    question: 'Can I choose what I study instead?',
    answer: 'Absolutely. Recommendations are optional. You always remain in complete control of your study plan.'
  },

  // Community Markers
  {
    id: 'cm-1',
    category: 'Community Markers',
    categoryIcon: Users,
    question: 'What are Community Markers?',
    answer: 'Markers are short, high-yield insights left by other students for specific topics, such as mnemonics, common mistakes, or useful resources. They are designed to provide quick context without creating a distracting social feed.'
  },
  {
    id: 'cm-2',
    category: 'Community Markers',
    categoryIcon: Users,
    question: 'Can anyone post a Marker?',
    answer: 'Any beta member can submit a Marker. Every submission is reviewed before becoming visible to the community.'
  },

  // Data & Privacy
  {
    id: 'dp-1',
    category: 'Data & Privacy',
    categoryIcon: ShieldCheck,
    question: 'Is my data synced across devices?',
    answer: 'Yes. Your study progress is securely synchronized through your Atlas account so it remains available across supported devices.'
  },
  {
    id: 'dp-2',
    category: 'Data & Privacy',
    categoryIcon: ShieldCheck,
    question: 'Can I export my data?',
    answer: 'Not during the initial Closed Beta. Data export and backup features are planned for a future release.'
  },

  // Closed Beta
  {
    id: 'cb-1',
    category: 'Closed Beta',
    categoryIcon: Lock,
    question: 'Why is Atlas invite-only?',
    answer: 'Keeping the beta intentionally small allows us to work closely with early members, respond quickly to feedback, and maintain a high-quality experience.'
  },
  {
    id: 'cb-2',
    category: 'Closed Beta',
    categoryIcon: Lock,
    question: 'Can I extend my beta access?',
    answer: "Yes. As Atlas evolves, you'll be able to renew your membership or transition to future plans when they become available."
  },

  // Support
  {
    id: 'sup-1',
    category: 'Support',
    categoryIcon: LifeBuoy,
    question: 'I found a bug. What should I do?',
    answer: 'Use Report a Bug in Settings. Every report is reviewed directly by the Atlas team.'
  },
  {
    id: 'sup-2',
    category: 'Support',
    categoryIcon: LifeBuoy,
    question: 'Can I request a feature?',
    answer: 'Absolutely. Atlas is being built alongside its early members, and thoughtful feedback directly influences future updates.'
  }
];

export function FaqSection() {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({ 'gs-1': true });

  const toggleItem = (id: string) => {
    setOpenIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Group FAQ items by category
  const categories = Array.from(new Set(FAQ_DATA.map(item => item.category)));

  return (
    <section>
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
          Help & FAQ
        </h2>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm divide-y divide-border/50 overflow-hidden">
        {categories.map(category => {
          const items = FAQ_DATA.filter(item => item.category === category);
          const CategoryIcon = items[0]?.categoryIcon || HelpCircle;

          return (
            <div key={category} className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider">
                <CategoryIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{category}</span>
              </div>

              <div className="space-y-2">
                {items.map(item => {
                  const isOpen = !!openIds[item.id];
                  return (
                    <div 
                      key={item.id} 
                      className="rounded-xl border border-border/40 bg-muted/20 overflow-hidden transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        className="w-full flex items-center justify-between p-3 sm:p-3.5 text-left text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors gap-3"
                      >
                        <span>{item.question}</span>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isOpen && (
                        <div className="px-3.5 pb-3.5 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/30 bg-muted/10 animate-in fade-in slide-in-from-top-1 duration-150">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
