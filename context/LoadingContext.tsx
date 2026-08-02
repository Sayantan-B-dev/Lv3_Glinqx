"use client";

import React, { createContext, useContext, useState, useEffect, Suspense, useMemo, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  beginPending: () => void;
  endPending: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// Separate component to listen to navigation changes inside a Suspense boundary
function NavigationListener() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setIsLoading } = useLoading();

  useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams, setIsLoading]);

  return null;
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoadingState] = useState(false);
  const pendingCountRef = useRef(0);
  const navLoadingRef = useRef(false);

  const setIsLoading = useMemo(
    () => (loading: boolean) => {
      navLoadingRef.current = loading;
      setIsLoadingState(loading || pendingCountRef.current > 0);
    },
    []
  );

  const beginPending = useMemo(
    () => () => {
      pendingCountRef.current += 1;
      setIsLoadingState(true);
    },
    []
  );

  const endPending = useMemo(
    () => () => {
      pendingCountRef.current = Math.max(0, pendingCountRef.current - 1);
      if (pendingCountRef.current === 0 && !navLoadingRef.current) {
        setIsLoadingState(false);
      }
    },
    []
  );

  // Track all in-flight fetches so the cursor spins during any network activity
  useEffect(() => {
    if (typeof window === "undefined") return;
    const originalFetch = window.fetch;

    window.fetch = async (...args: Parameters<typeof fetch>) => {
      beginPending();
      try {
        return await originalFetch(...args);
      } finally {
        endPending();
      }
    };

    // Global click listener to catch navigations early + show spinner on any click
    let timeout: NodeJS.Timeout;
    let clickTimer: NodeJS.Timeout;

    const handleGlobalClick = (e: MouseEvent) => {
      // Any click gets at least a short spinner so the cursor always "does something"
      navLoadingRef.current = true;
      setIsLoadingState(true);
      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => {
        navLoadingRef.current = false;
        if (pendingCountRef.current === 0) setIsLoadingState(false);
      }, 500);

      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (anchor && 
          anchor.href && 
          anchor.href.startsWith(window.location.origin) && 
          !anchor.href.includes("#") &&
          anchor.target !== "_blank" &&
          !anchor.getAttribute("download")) {
        
        // Only trigger for real navigations, not same-page hashes
        const currentPath = window.location.pathname;
        const targetPath = new URL(anchor.href).pathname;
        
        if (currentPath !== targetPath) {
          navLoadingRef.current = true;
          setIsLoadingState(true);
          
          // Safety timeout: reset loading if navigation takes too long or fails
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            navLoadingRef.current = false;
            if (pendingCountRef.current === 0) setIsLoadingState(false);
          }, 8000);
        }
      }
    };

    window.addEventListener("click", handleGlobalClick);
    return () => {
      window.removeEventListener("click", handleGlobalClick);
      clearTimeout(timeout);
      clearTimeout(clickTimer);
      window.fetch = originalFetch;
    };
  }, [beginPending, endPending, setIsLoading]);

  return (
    <LoadingContext.Provider value={useMemo(() => ({ isLoading, setIsLoading, beginPending, endPending }), [isLoading, setIsLoading, beginPending, endPending])}>
      <Suspense fallback={null}>
        <NavigationListener />
      </Suspense>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}