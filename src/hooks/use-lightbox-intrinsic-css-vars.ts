import { useCallback, useState, type CSSProperties, type SyntheticEvent } from "react";

/**
 * Sets --lightbox-intrinsic-max-w / --lightbox-intrinsic-max-h from the loaded image so
 * desktop lightbox CSS can use min(viewport, intrinsic) and avoid upscaling small assets.
 */
export function useLightboxIntrinsicCssVars(imageKey: string): {
  imgStyle: CSSProperties;
  onImageLoad: (e: SyntheticEvent<HTMLImageElement>) => void;
} {
  const [vars, setVars] = useState<{ imageKey: string; style: CSSProperties }>({
    imageKey: "",
    style: {},
  });

  const onImageLoad = useCallback((e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) return;
    setVars({
      imageKey,
      style: {
        ["--lightbox-intrinsic-max-w" as string]: `${w}px`,
        ["--lightbox-intrinsic-max-h" as string]: `${h}px`,
      },
    });
  }, [imageKey]);

  return { imgStyle: vars.imageKey === imageKey ? vars.style : {}, onImageLoad };
}
