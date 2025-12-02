// InstallBanner.jsx
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const InstallBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("installBannerDismissed");
    if (!dismissed) {
      setIsVisible(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("installBannerDismissed", "true");
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsVisible(false);
        sessionStorage.setItem("installBannerDismissed", "true");
      }
      setDeferredPrompt(null);
    }
  };

  if (!isVisible || !deferredPrompt) return null;

  return (
    <div className="fixed inset-x-0 top-[72px] z-40 flex justify-center px-6 md:px-3 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg md:rounded-xl shadow-md px-2.5 py-2 md:px-4 md:py-3 flex items-center gap-2 md:gap-3 w-full max-w-[280px] md:max-w-[360px]">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/9df84f495_LeaseShieldcrestlogonobkg.png"
          alt="Lease Shield" 
          className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-full"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-xs md:text-sm text-gray-900 dark:text-gray-100">
            Install Lease Shield
          </h3>
          <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 truncate">
            app.leaseshield.asia
          </p>
        </div>
        <Button 
          onClick={handleInstall}
          size="sm"
          variant="ghost"
          className="flex-shrink-0 text-primary hover:text-primary hover:bg-primary/10 font-medium text-xs md:text-sm px-2 md:px-3"
        >
          Install
        </Button>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-0.5 md:p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 dark:text-gray-500" />
        </button>
      </div>
    </div>
  );
};

export default InstallBanner;