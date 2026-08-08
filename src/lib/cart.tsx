import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/** Artículo del carrito de cotización del cliente (sin precios: los coloca el colaborador). */
export type CartItem = {
  id: string;
  name: string;
  brand?: string | null;
  model?: string | null;
  code?: string | null;
  image?: string | null;
  disponibilidad?: string | null;
  cantidad: number;
};

type CartCtx = {
  items: CartItem[];
  total: number;
  add: (item: Omit<CartItem, "cantidad">, cantidad?: number) => void;
  remove: (id: string) => void;
  setCantidad: (id: string, cantidad: number) => void;
  clear: () => void;
  abierto: boolean;
  setAbierto: (b: boolean) => void;
};

const KEY = "gbd_carrito_cotizacion";
const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      localStorage.removeItem(KEY);
    }
    setListo(true);
  }, []);

  useEffect(() => {
    if (!listo) return;
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, listo]);

  const add = useCallback((item: Omit<CartItem, "cantidad">, cantidad = 1) => {
    setItems((prev) => {
      const ya = prev.find((p) => p.id === item.id);
      if (ya) return prev.map((p) => (p.id === item.id ? { ...p, cantidad: p.cantidad + cantidad } : p));
      return [...prev, { ...item, cantidad }];
    });
  }, []);

  const remove = useCallback((id: string) => setItems((prev) => prev.filter((p) => p.id !== id)), []);
  const setCantidad = useCallback(
    (id: string, cantidad: number) =>
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, cantidad: Math.max(1, Math.min(99, cantidad)) } : p))),
    []
  );
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      total: items.reduce((a, b) => a + b.cantidad, 0),
      add,
      remove,
      setCantidad,
      clear,
      abierto,
      setAbierto,
    }),
    [items, abierto, add, remove, setCantidad, clear]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
