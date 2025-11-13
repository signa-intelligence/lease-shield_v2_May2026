
import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * Debounced Search Input
 * Delays search execution to reduce API calls
 */
export default function DebouncedSearch({
  onSearch,
  placeholder = "Search...",
  delay = 500,
  colors,
  language = 'en',
  minChars = 2
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchTerm.length === 0) {
      onSearch("");
      setIsSearching(false);
      return;
    }

    if (searchTerm.length < minChars) {
      return;
    }

    setIsSearching(true);
    
    const timer = setTimeout(() => {
      onSearch(searchTerm);
      setIsSearching(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [searchTerm, delay, onSearch, minChars]);

  const handleClear = () => {
    setSearchTerm("");
    onSearch("");
  };

  const strings = {
    en: {
      searching: "Searching...",
      clear: "Clear"
    },
    th: {
      searching: "กำลังค้นหา...",
      clear: "ล้าง"
    },
    zh: {
      searching: "搜索中...",
      clear: "清除"
    },
    ja: {
      searching: "検索中...",
      clear: "クリア"
    },
    ko: {
      searching: "검색 중...",
      clear: "지우기"
    }
  };

  const str = strings[language] || strings.en;

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" 
          style={{ color: colors?.textSecondary || '#64748b' }}
        />
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-10"
          style={{
            backgroundColor: colors?.inputBg || '#FFFFFF',
            borderColor: colors?.borderColor || '#E5E7EB',
            color: colors?.textPrimary || '#1A1D1F'
          }}
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition-colors"
            aria-label={str.clear}
          >
            <X className="w-4 h-4" style={{ color: colors?.textSecondary || '#64748b' }} />
          </button>
        )}
      </div>
      {isSearching && (
        <p className="text-xs mt-1" style={{ color: colors?.textSecondary || '#64748b' }}>
          {str.searching}
        </p>
      )}
    </div>
  );
}
