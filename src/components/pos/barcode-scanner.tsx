"use client";

import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { motion } from "framer-motion";
import { Camera, CameraOff, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose?: () => void;
  className?: string;
}

export function BarcodeScanner({ onScan, onClose, className }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastScanRef = useRef<string>("");
  const lastScanTimeRef = useRef(0);

  const stopScanner = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setActive(false);
  }, []);

  const startScanner = useCallback(async () => {
    setError(null);

    if (!videoRef.current) return;

    try {
      const reader = new BrowserMultiFormatReader();
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();

      if (!devices.length) {
        setError("No camera found");
        return;
      }

      const backCamera =
        devices.find((d) => /back|rear|environment/i.test(d.label)) ?? devices[0];

      controlsRef.current = await reader.decodeFromVideoDevice(
        backCamera.deviceId,
        videoRef.current,
        (result) => {
          if (!result) return;

          const code = result.getText();
          const now = Date.now();

          if (code === lastScanRef.current && now - lastScanTimeRef.current < 2000) {
            return;
          }

          lastScanRef.current = code;
          lastScanTimeRef.current = now;
          onScan(code);
        }
      );

      setActive(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start camera";
      setError(message);
      setActive(false);
    }
  }, [onScan]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Camera Scanner</span>
        </div>
        <div className="flex gap-2">
          {active ? (
            <Button type="button" variant="outline" size="sm" onClick={stopScanner}>
              <CameraOff className="h-4 w-4" />
              Stop
            </Button>
          ) : (
            <Button type="button" size="sm" onClick={startScanner}>
              <Camera className="h-4 w-4" />
              Start
            </Button>
          )}
          {onClose && (
            <Button type="button" variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
        />
        {active && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-32 w-48 rounded-lg border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
          </div>
        )}
        {!active && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
            Tap Start to scan barcode
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 text-center text-sm text-red-400">
            {error}
          </div>
        )}
      </div>
    </motion.div>
  );
}
