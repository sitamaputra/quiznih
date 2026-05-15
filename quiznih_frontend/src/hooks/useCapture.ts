"use client";
import { useState, useRef, useCallback } from "react";

/**
 * Hook for screenshot + screen recording using html2canvas-pro and MediaRecorder.
 */
export function useCapture() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Screenshot: capture a DOM element to PNG and trigger download
  const takeScreenshot = useCallback(async (element: HTMLElement, filename = "screenshot") => {
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const canvas = await html2canvas(element, {
        backgroundColor: "#050508",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `${filename}_${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      return true;
    } catch (err) {
      console.error("Screenshot failed:", err);
      return false;
    }
  }, []);

  // Start screen recording via getDisplayMedia
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" } as any,
        audio: true,
      });
      streamRef.current = stream;
      chunksRef.current = [];
      
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm",
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `recording_${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        
        // Cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setRecordingTime(0);
        setIsRecording(false);
      };

      // Also stop when user ends share
      stream.getVideoTracks()[0].onended = () => {
        if (recorderRef.current?.state === "recording") {
          recorderRef.current.stop();
        }
      };

      recorder.start(100);
      recorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);

      return true;
    } catch (err) {
      console.error("Recording failed:", err);
      return false;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }, []);

  const formatRecTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return {
    takeScreenshot,
    startRecording,
    stopRecording,
    isRecording,
    recordingTime,
    formatRecTime,
  };
}
