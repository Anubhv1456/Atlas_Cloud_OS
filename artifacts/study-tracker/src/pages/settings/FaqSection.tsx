import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles, BookOpen, Users, ShieldCheck, Lock, LifeBuoy, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  const toggleItem = (id: string) => {
    setOpenIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const categories = Array.from(new Set(FAQ_DATA.map(item => item.category)));

  const filteredData = FAQ_DATA.filter(item => {
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
    const matchesQuery = searchQuery.trim() === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <section>
      <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden transition-all">
        {/* Compact Expandable Tile Header */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsExpanded(!isExpanded)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsExpanded(!isExpanded);
            }
          }}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-muted/50 transition-colors text-left focus:outline-none cursor-pointer select-none"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-teal-500/10 rounded-xl text-teal-400 border border-teal-500/20 shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-foreground">Help & FAQ</h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full">
                  12 Questions
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Answers to common questions about recommendations, data, & beta access
              </p>
            </div>
          </div>
          <div className="inline-flex items-center justify-center rounded-xl h-8 px-3 text-xs font-semibold gap-1 shrink-0 bg-secondary/80 text-secondary-foreground hover:bg-secondary transition-colors">
            {isExpanded ? (
              <>
                Hide <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Show <ChevronDown className="w-4 h-4" />
              </>
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-4 sm:p-5 border-t border-border/80 space-y-4 bg-muted/20 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Search and Category Filter Bar */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search FAQ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-8 text-xs bg-background/80 border-border/60 h-8 rounded-xl"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className={`px-2.5 py-1 rounded-lg font-medium shrink-0 transition-colors ${
                    selectedCategory === null
                      ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 font-semibold'
                      : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                    className={`px-2.5 py-1 rounded-lg font-medium shrink-0 transition-colors ${
                      selectedCategory === cat
                        ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 font-semibold'
                        : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* List of FAQ Accordion Items */}
            {filteredData.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground bg-background/40 rounded-xl border border-dashed border-border/50">
                No matching questions found for "{searchQuery}".
              </div>
            ) : (
              <div className="space-y-2">
                {filteredData.map(item => {
                  const isOpen = !!openIds[item.id];
                  const CategoryIcon = item.categoryIcon || HelpCircle;
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-border/50 bg-card/70 overflow-hidden transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        className="w-full flex items-center justify-between p-3 text-left text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors gap-3"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <CategoryIcon className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span className="truncate">{item.question}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isOpen && (
                        <div className="px-3.5 pb-3.5 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/30 bg-muted/20 animate-in fade-in slide-in-from-top-1 duration-150">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
