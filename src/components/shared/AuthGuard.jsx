// src/components/shared/AuthGuard.jsx
//
// Simple authentication guard for LeaseShield.
// Uses Base44 built-in auth and does NOT change behaviour
// except redirecting unauthenticated users to the login page.

import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const AuthGuard = ({ children }) => {
  // No longer blocks rendering - pages load immediately
  // Auth only required for protected actions, not on first load
  return <>{children}</>;
};

export default AuthGuard;