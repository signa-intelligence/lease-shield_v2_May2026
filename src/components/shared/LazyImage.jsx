import React, { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

/**
 * Lazy Loading Image Component
 * Only loads images when they're visible in viewport
 * Shows loading state and handles errors gracefully
 */
export default function LazyImage({ 
  src, 
  alt = "", 
  className = "",
  style = {},
  fallback = null,
  loadingColor = "#C7A338",
  onLoad,
  onClick
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.01
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setError(true);
    setIsLoaded(true);
  };

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        ...style,
        backgroundColor: isLoaded ? 'transparent' : '#f3f4f6'
      }}
      onClick={onClick}
    >
      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 
            className="w-6 h-6 animate-spin" 
            style={{ color: loadingColor }}
          />
        </div>
      )}

      {error && fallback ? (
        fallback
      ) : error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center p-4">
            <p className="text-sm text-gray-500">Failed to load</p>
          </div>
        </div>
      ) : null}

      {isInView && !error && (
        <img
          src={src}
          alt={alt}
          className={className}
          style={{
            ...style,
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out'
          }}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
    </div>
  );
}