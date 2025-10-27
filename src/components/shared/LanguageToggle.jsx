import React from "react";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function LanguageToggle() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const updateLanguageMutation = useMutation({
    mutationFn: (newLang) => base44.auth.updateMe({ language: newLang }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  const currentLang = user?.language || 'en';

  const handleToggle = () => {
    const newLang = currentLang === 'en' ? 'th' : 'en';
    updateLanguageMutation.mutate(newLang);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      className="flex items-center gap-2"
    >
      <Globe className="w-4 h-4" />
      <span className="text-sm font-medium">
        {currentLang === 'en' ? 'ภาษาไทย' : 'English'}
      </span>
    </Button>
  );
}