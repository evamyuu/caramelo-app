import { useEffect, useRef, useState } from "react";

/** Open the device camera into a <video> element and release it on unmount. */
export function useCamera(facing: "user" | "environment") {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stream: MediaStream | undefined;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: facing } })
      .then(async (media) => {
        stream = media;
        if (cancelled || !videoRef.current) return media.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = media;
        await videoRef.current.play();
        setReady(true);
      })
      .catch((cause: Error) => setError(cause.message));
    if (!navigator.mediaDevices) setError("camera unavailable");
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [facing]);

  return { videoRef, ready, error };
}
