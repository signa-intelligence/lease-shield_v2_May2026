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

  // Redirect to dashboard - Welcome screen permanently removed
  React.useEffect(() => {
    // Check if there's a 'next' param (from login redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const nextUrl = urlParams.get('next') || '/dashboard';
    
    navigate(nextUrl, { replace: true });
  }, [navigate]);

  return null;
}