import { useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCloudinaryUrl } from "~/common/lib/utils";

interface ImageGalleryProps {
  images: string[];
  alt: string;
}

export default function ImageGallery({ images, alt }: ImageGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isSingle = images.length <= 1;

  const scrollTo = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const slideWidth = container.clientWidth;
    container.scrollTo({ left: slideWidth * index, behavior: "smooth" });
  }, []);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const slideWidth = container.clientWidth;
    if (slideWidth === 0) return;
    const index = Math.round(container.scrollLeft / slideWidth);
    setActiveIndex(index);
  }, []);

  // Single image fallback — no gallery chrome
  if (isSingle) {
    return (
      <div className="w-full">
        <img
          src={getCloudinaryUrl(images[0] ?? "", 800)}
          alt={alt}
          loading="lazy"
          className="w-full object-cover landscape:max-h-[50vh] lg:rounded-2xl lg:shadow-lg lg:max-h-[600px]"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Scroll-snap container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden -ms-overflow-style-none scrollbar-none"
      >
        {images.map((url, i) => (
          <div
            key={i}
            className="shrink-0 w-full snap-center"
          >
            <img
              src={getCloudinaryUrl(url, 800)}
              alt={`${alt} — imagen ${i + 1}`}
              loading="lazy"
              draggable={false}
              className="w-full object-cover landscape:max-h-[50vh] lg:max-h-[600px] select-none"
            />
          </div>
        ))}
      </div>

      {/* Nav arrows */}
      <button
        onClick={() => scrollTo(activeIndex - 1)}
        disabled={activeIndex === 0}
        aria-label="Imagen anterior"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-primary-700 hover:text-primary-900 hover:bg-white transition-all duration-200 shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={() => scrollTo(activeIndex + 1)}
        disabled={activeIndex === images.length - 1}
        aria-label="Imagen siguiente"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-primary-700 hover:text-primary-900 hover:bg-white transition-all duration-200 shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dot indicators */}
      <div
        className="flex justify-center gap-2 mt-3"
        role="tablist"
        aria-label="Galería de imágenes"
      >
        {images.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === activeIndex}
            aria-label={`Imagen ${i + 1}`}
            onClick={() => scrollTo(i)}
            className={[
              "w-3 h-3 rounded-full transition-all duration-300",
              i === activeIndex
                ? "bg-primary-500 scale-110"
                : "bg-primary-200 hover:bg-primary-300",
            ].join(" ")}
          />
        ))}
      </div>
    </div>
  );
}
