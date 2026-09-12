import { useEffect, useRef } from 'react';

/**
 * The motion export has a flat studio backdrop. This lightweight canvas keeps
 * the animated GIF intact while removing only backdrop pixels connected to an
 * outer edge, so Baymax's white body is preserved inside its navy outline.
 */
export function TransparentPet({ src, label }: { src: string; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;

    const image = new Image();
    let frameId = 0;
    let lastPaint = 0;
    let active = true;

    const paint = (time: number) => {
      if (!active) return;
      if (time - lastPaint >= 55) {
        lastPaint = time;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        removeConnectedBackdrop(context, canvas.width, canvas.height);
      }
      frameId = requestAnimationFrame(paint);
    };

    image.onload = () => {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        removeConnectedBackdrop(context, canvas.width, canvas.height);
      } else {
        frameId = requestAnimationFrame(paint);
      }
    };
    image.src = src;

    return () => {
      active = false;
      cancelAnimationFrame(frameId);
    };
  }, [src]);

  return <canvas ref={canvasRef} className="splash-pet-canvas" role="img" aria-label={label} />;
}

function removeConnectedBackdrop(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const frame = context.getImageData(0, 0, width, height);
  const pixels = frame.data;
  const seen = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  const corners = [0, width - 1, (height - 1) * width, height * width - 1];
  const base = corners.reduce(
    (sum, index) => {
      const offset = index * 4;
      sum[0] += pixels[offset];
      sum[1] += pixels[offset + 1];
      sum[2] += pixels[offset + 2];
      return sum;
    },
    [0, 0, 0],
  ).map((value) => value / corners.length);

  const resemblesBackdrop = (index: number) => {
    const offset = index * 4;
    const difference = Math.abs(pixels[offset] - base[0])
      + Math.abs(pixels[offset + 1] - base[1])
      + Math.abs(pixels[offset + 2] - base[2]);
    return difference < 82;
  };

  const enqueue = (index: number) => {
    if (seen[index] || !resemblesBackdrop(index)) return;
    seen[index] = 1;
    queue[tail++] = index;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }

  while (head < tail) {
    const index = queue[head++];
    pixels[index * 4 + 3] = 0;
    const x = index % width;
    if (x > 0) enqueue(index - 1);
    if (x < width - 1) enqueue(index + 1);
    if (index >= width) enqueue(index - width);
    if (index < width * (height - 1)) enqueue(index + width);
  }

  context.putImageData(frame, 0, 0);
}
