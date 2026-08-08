import { useEffect, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minus,
  Package,
  Plus,
  RotateCcw,
} from "lucide-react";

export function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const imgs = (images ?? []).filter(Boolean);
  const [index, setIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  useEffect(() => {
    setIndex(0);
  }, [imgs.join("|")]);

  const total = imgs.length;
  const actual = Math.min(index, Math.max(total - 1, 0));
  const prev = () => setIndex((i) => (i - 1 + total) % total);
  const next = () => setIndex((i) => (i + 1) % total);

  if (total === 0) {
    return (
      <div className="aspect-square grid place-items-center rounded-xl bg-muted text-muted-foreground">
        <Package className="h-16 w-16" />
      </div>
    );
  }

  return (
    <div>
      <div className="group relative aspect-square overflow-hidden rounded-xl bg-muted">
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          className="h-full w-full cursor-zoom-in"
          aria-label="Ampliar imagen"
        >
          <img
            src={imgs[actual]}
            alt={`${alt} — imagen ${actual + 1} de ${total}`}
            className="h-full w-full object-cover"
          />
        </button>

        <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-background/85 p-2 text-foreground shadow-sm">
          <Maximize2 className="h-4 w-4" />
        </span>

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Imagen anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/85 p-2 text-foreground shadow-sm transition hover:bg-background"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Imagen siguiente"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/85 p-2 text-foreground shadow-sm transition hover:bg-background"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-background/85 px-2.5 py-1 text-xs font-medium text-foreground">
              {actual + 1} / {total}
            </span>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
          {imgs.map((img, i) => (
            <button
              type="button"
              key={`${img}-${i}`}
              onClick={() => setIndex(i)}
              aria-label={`Ver imagen ${i + 1}`}
              className={`aspect-square overflow-hidden rounded-md bg-muted ring-offset-2 transition ${
                i === actual ? "ring-2 ring-primary" : "opacity-75 hover:opacity-100"
              }`}
            >
              <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-5xl p-2 sm:p-4">
          <TransformWrapper doubleClick={{ mode: "toggle", step: 1.4 }} wheel={{ step: 0.15 }}>
            {({ zoomIn, zoomOut, resetTransform }) => (
              <div>
                <div className="relative overflow-hidden rounded-lg bg-muted">
                  <TransformComponent
                    wrapperStyle={{ width: "100%", height: "min(70vh, 640px)" }}
                    contentStyle={{ width: "100%", height: "100%" }}
                  >
                    <img
                      src={imgs[actual]}
                      alt={`${alt} — imagen ${actual + 1}`}
                      className="h-full w-full object-contain"
                    />
                  </TransformComponent>

                  {total > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={prev}
                        aria-label="Imagen anterior"
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/85 p-2 shadow-sm hover:bg-background"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={next}
                        aria-label="Imagen siguiente"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/85 p-2 shadow-sm hover:bg-background"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => zoomOut()}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => zoomIn()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => resetTransform()}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Restablecer
                  </Button>
                  {total > 1 && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {actual + 1} / {total}
                    </span>
                  )}
                </div>

                {total > 1 && (
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {imgs.map((img, i) => (
                      <button
                        type="button"
                        key={`z-${img}-${i}`}
                        onClick={() => { setIndex(i); resetTransform(); }}
                        aria-label={`Ver imagen ${i + 1}`}
                        className={`h-14 w-14 overflow-hidden rounded-md bg-muted transition ${
                          i === actual ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TransformWrapper>
        </DialogContent>
      </Dialog>
    </div>
  );
}
