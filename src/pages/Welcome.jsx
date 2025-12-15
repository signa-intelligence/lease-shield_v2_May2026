import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Calendar, FolderLock, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { haptic } from "../components/shared/HapticFeedback";
import LoadingSpinner from "../components/shared/LoadingSpinner";

export default function Welcome() {
  const navigate = useNavigate();

  // Immediately redirect to Dashboard - no welcome screen
  React.useEffect(() => {
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  // No UI needed - just redirect
  return null;
}