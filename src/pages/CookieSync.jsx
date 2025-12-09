import { useEffect } from "react";

export default function CookieSync() {
  useEffect(() => {
    localStorage.setItem("lease_cookie_dump", document.cookie);
    window.location.href = "/";
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      fontSize: '18px',
      color: '#666'
    }}>
      Syncing…
    </div>
  );
}