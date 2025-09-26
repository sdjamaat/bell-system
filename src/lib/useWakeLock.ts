"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Type definitions for Wake Lock API
interface WakeLock {
  released: boolean;
  release(): Promise<void>;
  addEventListener(type: "release", listener: () => void): void;
  removeEventListener(type: "release", listener: () => void): void;
}

interface WakeLockSentinel extends WakeLock {}

interface Navigator {
  wakeLock?: {
    request(type: "screen"): Promise<WakeLockSentinel>;
  };
}

export function useWakeLock() {
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Check if Wake Lock API is supported
  useEffect(() => {
    if (typeof window !== "undefined" && "wakeLock" in navigator) {
      setIsSupported(true);
    }
  }, []);

  // Request wake lock
  const requestWakeLock = useCallback(async () => {
    if (!isSupported) {
      setError("Wake Lock API is not supported in this browser");
      return;
    }

    try {
      // Type assertion for navigator with wakeLock
      const nav = navigator as Navigator;
      if (!nav.wakeLock) {
        throw new Error("Wake Lock API not available");
      }

      wakeLockRef.current = await nav.wakeLock.request("screen");
      setIsActive(true);
      setError(null);

      // Add release event listener
      const handleRelease = () => {
        setIsActive(false);
        wakeLockRef.current = null;
      };

      wakeLockRef.current.addEventListener("release", handleRelease);

      return wakeLockRef.current;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to acquire wake lock";
      setError(errorMessage);
      setIsActive(false);
      console.error("Wake Lock error:", err);
    }
  }, [isSupported]);

  // Release wake lock
  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current && !wakeLockRef.current.released) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsActive(false);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to release wake lock";
        setError(errorMessage);
        console.error("Failed to release wake lock:", err);
      }
    }
  }, []);

  // Handle visibility changes
  useEffect(() => {
    if (!isSupported) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && wakeLockRef.current === null) {
        // Re-acquire wake lock when tab becomes visible
        await requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isSupported, requestWakeLock]);

  // Request wake lock on mount
  useEffect(() => {
    if (isSupported) {
      requestWakeLock();
    }

    // Cleanup on unmount
    return () => {
      if (wakeLockRef.current) {
        releaseWakeLock();
      }
    };
  }, [isSupported]); // Intentionally not including requestWakeLock and releaseWakeLock to avoid infinite loops

  return {
    isSupported,
    isActive,
    error,
    request: requestWakeLock,
    release: releaseWakeLock,
  };
}
