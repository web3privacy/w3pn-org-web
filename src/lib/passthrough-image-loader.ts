import type { ImageLoaderProps } from "next/image";

export function passthroughImageLoader({ src }: ImageLoaderProps): string {
  return src;
}
