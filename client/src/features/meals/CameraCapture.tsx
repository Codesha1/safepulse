import { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { useI18n } from '../../i18n';
import { Modal, Spinner } from '../../components/ui';

/** Live camera capture (getUserMedia). Calls onError if the camera is unavailable/denied. */
export function CameraCapture({ open, onClose, onCapture, onError }: { open: boolean; onClose: () => void; onCapture: (f: File) => void; onError: () => void }) {
  const { t } = useI18n(); const video = useRef<HTMLVideoElement>(null); const stream = useRef<MediaStream | null>(null); const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!open) return;
    let cancelled = false; setReady(false);
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then((s) => { if (cancelled) { s.getTracks().forEach((x) => x.stop()); return; } stream.current = s; if (video.current) { video.current.srcObject = s; video.current.play().then(() => setReady(true)).catch(() => {}); } })
      .catch(() => { if (!cancelled) { onClose(); onError(); } });
    return () => { cancelled = true; stream.current?.getTracks().forEach((x) => x.stop()); stream.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const snap = () => {
    const v = video.current; if (!v || !v.videoWidth) return;
    const c = document.createElement('canvas'); const max = 1280; const k = Math.min(1, max / Math.max(v.videoWidth, v.videoHeight));
    c.width = v.videoWidth * k; c.height = v.videoHeight * k; c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height);
    c.toBlob((b) => { if (b) { onCapture(new File([b], 'meal.jpg', { type: 'image/jpeg' })); onClose(); } }, 'image/jpeg', 0.88);
  };
  return (
    <Modal open={open} onClose={onClose} title={t('scanner.camera')} wide>
      <div className="relative overflow-hidden rounded-3xl bg-black"><video ref={video} playsInline muted className="aspect-[4/3] w-full object-cover" aria-label={t('scanner.cameraPreview')} />{!ready && <div className="absolute inset-0 grid place-items-center text-white"><Spinner className="h-8 w-8" /></div>}</div>
      <div className="mt-4 flex gap-3"><button type="button" className="btn-mint flex-1" onClick={snap} disabled={!ready}><Camera className="h-5 w-5" aria-hidden />{t('scanner.capture')}</button><button type="button" className="btn-soft" onClick={onClose}>{t('common.cancel')}</button></div>
    </Modal>
  );
}
