"use client";

import { useEffect, useState } from "react";

/** Global CRT layer: scanlines, animated grain, vignette. */
export function Overlays() {
  const [noise, setNoise] = useState<string | null>(null);

  useEffect(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 160;
    const g = c.getContext("2d");
    if (!g) return;
    const img = g.createImageData(160, 160);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    setNoise(c.toDataURL("image/png"));
  }, []);

  return (
    <>
      <div className="fx-vignette" aria-hidden="true" />
      <div className="fx-scanlines" aria-hidden="true" />
      {noise && <div className="fx-noise" aria-hidden="true" style={{ backgroundImage: `url(${noise})` }} />}
    </>
  );
}
