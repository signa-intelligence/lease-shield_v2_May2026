import React from "react";

// AuthGuard is now deprecated - auth is handled at root level
// This component is kept for backwards compatibility but does nothing
const AuthGuard = ({ children }) => {
  return <>{children}</>;
};

export default AuthGuard;