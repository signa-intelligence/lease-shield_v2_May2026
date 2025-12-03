import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  ChevronLeft, ChevronDown, ChevronRight, Search, 
  HelpCircle, Rocket, Scan, Wallet, Wrench, FolderOpen, 
  Scale, MessageCircle, CreditCard, Shield, X
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { faqData, faqStrings } from "../components/faq/faqData";

const iconMap = {
  Rocket, Scan, Wallet, Wrench, FolderOpen, Scale, MessageCircle, CreditCard, Shield
};

export default function FAQ() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [openItemId, setOpenItemId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const strings = faqStrings[language] || faqStrings.en;

  // Check URL for direct question link
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categoryId = params.get('category');
    const questionId = params.get('q');
    
    if (categoryId) {
      setSelectedCategory(categoryId);
      if (questionId) {
        setOpenItemId(questionId);
        // Scroll to question after render
        setTimeout(() => {
          const element = document.getElementById(`faq-${questionId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  }, []);

  const colors = isDarkMode ? {
    bg: '#111827',
    cardBg: '#1F2937',
    textPrimary: '#F9FAFB',
    textSecondary: '#9CA3AF',
    borderColor: 'rgba(255,255,255,0.1)',
    hoverBg: '#374151',
    accentBg: 'rgba(12,59,46,0.3)'
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    borderColor: 'rgba(0,0,0,0.08)',
    hoverBg: '#F1F5F9',
    accentBg: 'rgba(12,59,46,0.05)'
  };

  // Filter FAQ items based on search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return null;
    
    const query = searchQuery.toLowerCase();
    const results = [];
    
    faqData.categories.forEach(category => {
      category.items.forEach(item => {
        const question = (item.q[language] || item.q.en).toLowerCase();
        const answer = (item.a[language] || item.a.en).toLowerCase();
        
        if (question.includes(query) || answer.includes(query)) {
          results.push({
            ...item,
            categoryId: category.id,
            categoryTitle: category.title[language] || category.title.en
          });
        }
      });
    });
    
    return results;
  }, [searchQuery, language]);

  const toggleItem = (itemId) => {
    setOpenItemId(openItemId === itemId ? null : itemId);
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setOpenItemId(null);
    setSearchQuery("");
  };

  const handleBack = () => {
    setSelectedCategory(null);
    setOpenItemId(null);
  };

  const currentCategory = selectedCategory 
    ? faqData.categories.find(c => c.id === selectedCategory)
    : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          {selectedCategory ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 mb-4 text-sm font-medium transition-colors"
              style={{ color: '#0C3B2E' }}
            >
              <ChevronLeft className="w-4 h-4" />
              {strings.backToCategories}
            </button>
          ) : (
            <Link to={createPageUrl("Dashboard")}>
              <button
                className="flex items-center gap-2 mb-4 text-sm font-medium transition-colors"
                style={{ color: colors.textSecondary }}
              >
                <ChevronLeft className="w-4 h-4" />
                {language === 'th' ? 'กลับ' : 'Back'}
              </button>
            </Link>
          )}
          
          <div className="flex items-center gap-3 mb-2">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#0C3B2E' }}
            >
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                {currentCategory ? (currentCategory.title[language] || currentCategory.title.en) : strings.title}
              </h1>
              {!currentCategory && (
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {strings.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Search */}
        {!selectedCategory && (
          <div className="relative mb-6">
            <Search 
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" 
              style={{ color: colors.textSecondary }}
            />
            <Input
              type="text"
              placeholder={strings.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-10 h-12 text-base rounded-xl border-2"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.borderColor,
                color: colors.textPrimary
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <X className="w-5 h-5" style={{ color: colors.textSecondary }} />
              </button>
            )}
          </div>
        )}

        {/* Search Results */}
        {filteredData && (
          <div className="space-y-3 mb-6">
            {filteredData.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: colors.textSecondary }} />
                <p style={{ color: colors.textSecondary }}>{strings.noResults}</p>
              </div>
            ) : (
              filteredData.map((item) => (
                <FAQItem
                  key={item.id}
                  item={item}
                  language={language}
                  isOpen={openItemId === item.id}
                  onToggle={() => toggleItem(item.id)}
                  colors={colors}
                  categoryLabel={item.categoryTitle}
                />
              ))
            )}
          </div>
        )}

        {/* Category Grid (when no search and no category selected) */}
        {!filteredData && !selectedCategory && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
            {faqData.categories.map((category) => {
              const Icon = iconMap[category.icon] || HelpCircle;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className="p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02]"
                  style={{
                    backgroundColor: colors.cardBg,
                    borderColor: colors.borderColor
                  }}
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                    style={{ backgroundColor: colors.accentBg }}
                  >
                    <Icon className="w-5 h-5" style={{ color: '#0C3B2E' }} />
                  </div>
                  <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                    {category.title[language] || category.title.en}
                  </p>
                  <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                    {category.items.length} {language === 'th' ? 'คำถาม' : 'questions'}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* Category Questions */}
        {!filteredData && currentCategory && (
          <div className="space-y-3">
            {currentCategory.items.map((item) => (
              <FAQItem
                key={item.id}
                item={item}
                language={language}
                isOpen={openItemId === item.id}
                onToggle={() => toggleItem(item.id)}
                colors={colors}
              />
            ))}
          </div>
        )}

        {/* Contact Support */}
        <Card 
          className="mt-8 border-2"
          style={{ 
            backgroundColor: colors.accentBg,
            borderColor: '#0C3B2E'
          }}
        >
          <CardContent className="p-6 text-center">
            <p className="font-semibold mb-3" style={{ color: colors.textPrimary }}>
              {strings.contactSupport}
            </p>
            <Link to={createPageUrl("Support")}>
              <Button 
                className="bg-[#0C3B2E] hover:bg-[#0A3326] text-white"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {strings.contactSupportBtn}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FAQItem({ item, language, isOpen, onToggle, colors, categoryLabel }) {
  const question = item.q[language] || item.q.en;
  const answer = item.a[language] || item.a.en;

  return (
    <div
      id={`faq-${item.id}`}
      className="rounded-xl border-2 overflow-hidden transition-all"
      style={{
        backgroundColor: colors.cardBg,
        borderColor: isOpen ? '#0C3B2E' : colors.borderColor
      }}
    >
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-start justify-between gap-3 text-left"
      >
        <div className="flex-1">
          {categoryLabel && (
            <span 
              className="text-xs font-medium px-2 py-0.5 rounded-full mb-2 inline-block"
              style={{ 
                backgroundColor: colors.accentBg,
                color: '#0C3B2E'
              }}
            >
              {categoryLabel}
            </span>
          )}
          <p className="font-semibold" style={{ color: colors.textPrimary }}>
            {question}
          </p>
        </div>
        <ChevronDown 
          className={`w-5 h-5 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: colors.textSecondary }}
        />
      </button>
      
      {isOpen && (
        <div 
          className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200"
        >
          <div 
            className="pt-3 border-t text-sm leading-relaxed"
            style={{ 
              borderColor: colors.borderColor,
              color: colors.textSecondary
            }}
          >
            {answer.split('\n').map((line, idx) => {
              // Check if line contains markdown link [text](url)
              const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
              if (linkMatch) {
                const [fullMatch, linkText, url] = linkMatch;
                const parts = line.split(fullMatch);
                return (
                  <div key={idx} className="mb-2">
                    {parts[0]}
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold underline hover:no-underline"
                      style={{ color: '#0C3B2E' }}
                    >
                      {linkText}
                    </a>
                    {parts[1]}
                  </div>
                );
              }
              return <div key={idx} className="mb-2">{line}</div>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}