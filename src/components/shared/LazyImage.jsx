import React, { useState, useEffect, useRef } from "react";
import { Loader2, ImageOff } from "lucide-react";

/**
 * Lazy Loading Image Component
 * Only loads images when they enter viewport
 * Shows progressive loading states
 */
export default function LazyImage({
  src,
  alt = "",
  className = "",
  style = {},
  placeholder = null,
  threshold = 0.1,
  onLoad,
  onError,
  fallback = null
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { threshold }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [threshold]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setHasError(true);
    if (onError) onError(e);
  };

  // Default placeholder: blurred background
  const defaultPlaceholder = (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{
        ...style,
        backgroundColor: '#E5E7EB',
        minHeight: '100px'
      }}
    >
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );

  // Error state
  if (hasError) {
    if (fallback) return fallback;
    
    return (
      <div
        className={`flex flex-col items-center justify-center ${className}`}
        style={{
          ...style,
          backgroundColor: '#FEE2E2',
          minHeight: '100px'
        }}
      >
        <ImageOff className="w-8 h-8 text-red-400 mb-2" />
        <p className="text-xs text-red-600">Failed to load image</p>
      </div>
    );
  }

  return (
    <div ref={imgRef} style={{ position: 'relative', ...style }}>
      {!isInView || !isLoaded ? (
        placeholder || defaultPlaceholder
      ) : null}
      
      {isInView && (
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

/**
 * Lazy Background Image Component
 */
export function LazyBackgroundImage({
  src,
  children,
  className = "",
  style = {},
  threshold = 0.1
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const divRef = useRef(null);

  useEffect(() => {
    if (!divRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { threshold }
    );

    observer.observe(divRef.current);

    return () => observer.disconnect();
  }, [threshold]);

  useEffect(() => {
    if (isInView && src) {
      const img = new Image();
      img.src = src;
      img.onload = () => setIsLoaded(true);
    }
  }, [isInView, src]);

  return (
    <div
      ref={divRef}
      className={className}
      style={{
        ...style,
        backgroundImage: isLoaded ? `url(${src})` : 'none',
        backgroundColor: isLoaded ? 'transparent' : '#E5E7EB',
        transition: 'background-image 0.3s ease-in-out'
      }}
    >
      {children}
    </div>
  );
}