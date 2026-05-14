import { useEffect, useState } from "react";

/**
 * useSlideModal
 *
 * Patrón unificado para todos los modales slide-from-right del sistema SIE.
 *
 * - renderizar: controla si el DOM existe (evita parpadeo al montar)
 * - visible: dispara la animación CSS translate-x
 * - Al abrir: monta el DOM → 50ms después activa la animación (slide in)
 * - Al cerrar: quita la animación (slide out) → 300ms después desmonta el DOM
 *
 * Uso:
 *   const { renderizar, visible } = useSlideModal(abierto, onClose, resetFn);
 */
export function useSlideModal(
  abierto: boolean,
  onClose: () => void,
  onReset?: () => void,
) {
  const [renderizar, setRenderizar] = useState(false);
  const [visible, setVisible]       = useState(false);

  useEffect(() => {
    if (abierto) {
      setRenderizar(true);
      const t = window.setTimeout(() => setVisible(true), 50);
      return () => window.clearTimeout(t);
    }

    // Cierre: primero quita la animación, luego desmonta
    setVisible(false);
    const t = window.setTimeout(() => {
      setRenderizar(false);
      onReset?.();
    }, 300);
    return () => window.clearTimeout(t);
  }, [abierto]);

  return { renderizar, visible };
}
