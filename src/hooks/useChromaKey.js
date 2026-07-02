import { useEffect, useState } from "react";

// Removes a flat/white background from a portrait so it can be composited
// onto a scene. Flood-fills from the image borders, turning background
// pixels transparent, with a soft feathered edge. Ported from the
// PassPoint lesson stage. Results are cached per-URL so re-mounts are
// instant.

const processedCache = new Map();

export default function useChromaKey(imageUrl, enabled = true) {
  const [processedUrl, setProcessedUrl] = useState(imageUrl);

  useEffect(() => {
    if (!enabled || !imageUrl || imageUrl.startsWith("data:")) {
      setProcessedUrl(imageUrl);
      return;
    }
    if (processedCache.has(imageUrl)) {
      setProcessedUrl(processedCache.get(imageUrl));
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setProcessedUrl(imageUrl);
        return;
      }
      ctx.drawImage(img, 0, 0);
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = canvas.width;
        const height = canvas.height;

        // Sample the background colour from the top-left corner.
        const bgR = data[0];
        const bgG = data[1];
        const bgB = data[2];
        const isWhiteBg = bgR > 220 && bgG > 220 && bgB > 220;

        const visited = new Uint8Array(width * height);
        const queue = [];
        const pushPixel = (x, y) => {
          const idx = y * width + x;
          if (!visited[idx]) {
            visited[idx] = 1;
            queue.push(x, y);
          }
        };
        for (let x = 0; x < width; x++) {
          pushPixel(x, 0);
          pushPixel(x, height - 1);
        }
        for (let y = 0; y < height; y++) {
          pushPixel(0, y);
          pushPixel(width - 1, y);
        }

        let head = 0;
        const threshold = isWhiteBg ? 48 : 60;
        while (head < queue.length) {
          const cx = queue[head++];
          const cy = queue[head++];
          const neighbors = [
            [cx + 1, cy],
            [cx - 1, cy],
            [cx, cy + 1],
            [cx, cy - 1],
          ];
          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIdx = ny * width + nx;
              if (!visited[nIdx]) {
                const pi = nIdx * 4;
                const rr = data[pi];
                const gg = data[pi + 1];
                const bb = data[pi + 2];
                const dist = Math.sqrt(
                  (rr - bgR) ** 2 + (gg - bgG) ** 2 + (bb - bgB) ** 2,
                );
                let isBg = false;
                if (isWhiteBg) {
                  const maxVal = Math.max(rr, gg, bb);
                  const minVal = Math.min(rr, gg, bb);
                  const isNeutral = maxVal - minVal < 25;
                  isBg =
                    dist < threshold ||
                    (rr > 215 && gg > 215 && bb > 215 && isNeutral);
                } else {
                  isBg = dist < threshold;
                }
                if (isBg) {
                  visited[nIdx] = 1;
                  queue.push(nx, ny);
                }
              }
            }
          }
        }

        // Fully transparent background.
        for (let idx = 0; idx < width * height; idx++) {
          if (visited[idx] === 1) data[idx * 4 + 3] = 0;
        }
        // Gentle edge feathering on the boundary.
        for (let idx = 0; idx < width * height; idx++) {
          if (visited[idx] === 0) {
            const x = idx % width;
            const y = Math.floor(idx / width);
            const neighbors = [
              [x + 1, y],
              [x - 1, y],
              [x, y + 1],
              [x, y - 1],
            ];
            let hasBgNeighbor = false;
            for (const [nx, ny] of neighbors) {
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                if (visited[ny * width + nx] === 1) {
                  hasBgNeighbor = true;
                  break;
                }
              }
            }
            if (hasBgNeighbor) data[idx * 4 + 3] = 140;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        processedCache.set(imageUrl, dataUrl);
        if (!cancelled) setProcessedUrl(dataUrl);
      } catch {
        if (!cancelled) setProcessedUrl(imageUrl);
      }
    };
    img.onerror = () => {
      if (!cancelled) setProcessedUrl(imageUrl);
    };

    return () => {
      cancelled = true;
    };
  }, [imageUrl, enabled]);

  return processedUrl;
}
