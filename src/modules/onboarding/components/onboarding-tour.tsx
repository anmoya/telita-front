"use client";

import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";

type NavigateFn = (menu: string) => void;

const TOUR_STEPS: Array<{
  element: string;
  navigateTo: string;
  delay?: number;
  popover: { title: string; description: string };
}> = [
  // --- Cotizaciones ---
  {
    element: "#menu-item-pricing",
    navigateTo: "pricing",
    popover: {
      title: "1. Cotizaciones",
      description: "Todo empieza aqui. Selecciona el SKU de tela, ingresa el ancho y largo que necesita el cliente, y el sistema calcula precio, IVA y total automaticamente."
    }
  },
  {
    element: "#section-pricing",
    navigateTo: "pricing",
    delay: 200,
    popover: {
      title: "El formulario de cotizacion",
      description: "Puedes agregar multiples items a la vez, asignarles categorias y notas. Al calcular se muestra el desglose por item y el total consolidado con IVA."
    }
  },
  // --- Ventas ---
  {
    element: "#menu-item-sales",
    navigateTo: "sales",
    popover: {
      title: "2. Ventas",
      description: "Una cotizacion confirmada se convierte en venta. Desde aqui puedes confirmarla o anularla antes de que se ejecute el corte."
    }
  },
  {
    element: "#section-sales",
    navigateTo: "sales",
    delay: 600,
    popover: {
      title: "Tabla de ventas",
      description: "Cada fila es una venta con su estado:<br><br><b>DRAFT</b> — cotizacion pendiente de confirmar.<br><b>CONFIRMED</b> — venta aprobada, genera trabajo de corte.<br><b>CANCELED</b> — anulada antes del corte."
    }
  },
  // --- Cortes ---
  {
    element: "#menu-item-cuts",
    navigateTo: "cuts",
    popover: {
      title: "3. Cortes",
      description: "Cada venta confirmada genera un trabajo de corte. El operador lo ejecuta fisicamente y lo registra aqui."
    }
  },
  {
    element: "#section-cuts",
    navigateTo: "cuts",
    delay: 600,
    popover: {
      title: "Tabla de cortes",
      description: "Estados del corte:<br><br><b>PENDING</b> — esperando ejecucion.<br><b>IN_PROGRESS</b> — en proceso.<br><b>CUT</b> — ejecutado, el retazo queda pendiente de ubicacion.<br><b>DELIVERED</b> — entregado al cliente."
    }
  },
  // --- Retazos ---
  {
    element: "#menu-item-scraps",
    navigateTo: "scraps",
    popover: {
      title: "4. Retazos",
      description: "El sobrante de cada corte queda registrado como retazo. Aqui se almacena con una ubicacion fisica para poder reutilizarlo."
    }
  },
  {
    element: "#section-scraps",
    navigateTo: "scraps",
    delay: 800,
    popover: {
      title: "Estados de retazos",
      description:
        "Cada retazo puede estar en uno de estos estados:<br><br>" +
        "<b>Pendiente almacenamiento</b> — recien cortado, falta asignarle ubicacion.<br>" +
        "<b>Almacenado (STORED)</b> — guardado en estante. El sistema lo sugerira en ventas futuras compatibles.<br>" +
        "<b>Usado (USED)</b> — reutilizado en una venta, ya no disponible.<br>" +
        "<b>Descartado (DISCARDED)</b> — demasiado pequeno o deteriorado, dado de baja."
    }
  },
  // --- Cierre ---
  {
    element: "#menu-item-pricing",
    navigateTo: "pricing",
    popover: {
      title: "Listo!",
      description: "El ciclo completo: <b>cotizar → confirmar → cortar → almacenar → reutilizar</b>.<br><br>En futuras cotizaciones el sistema sugerira automaticamente retazos almacenados compatibles con el pedido."
    }
  }
];

function navigateAndMove(driverInstance: Driver, navigate: NavigateFn, targetIndex: number) {
  const step = TOUR_STEPS[targetIndex];
  if (!step) return;

  navigate(step.navigateTo);

  const delay = step.delay ?? 150;
  setTimeout(() => {
    driverInstance.moveTo(targetIndex);
  }, delay);
}

export function startTour(navigate: NavigateFn, onComplete: () => void) {
  const steps = TOUR_STEPS.map((step) => ({ element: step.element, popover: step.popover }));

  const driverInstance = driver({
    showProgress: true,
    animate: true,
    overlayColor: "rgba(0,0,0,0.5)",
    progressText: "Paso {{current}} de {{total}}",
    nextBtnText: "Siguiente →",
    prevBtnText: "← Anterior",
    doneBtnText: "Finalizar",
    allowClose: true,
    onNextClick: () => {
      const current = driverInstance.getActiveIndex() ?? 0;
      const next = current + 1;
      if (next >= TOUR_STEPS.length) {
        driverInstance.destroy();
        onComplete();
        return;
      }
      navigateAndMove(driverInstance, navigate, next);
    },
    onPrevClick: () => {
      const current = driverInstance.getActiveIndex() ?? 0;
      const prev = current - 1;
      if (prev < 0) return;
      navigateAndMove(driverInstance, navigate, prev);
    },
    onDestroyStarted: () => {
      driverInstance.destroy();
      onComplete();
    },
    steps
  });

  navigate(TOUR_STEPS[0].navigateTo);
  setTimeout(() => driverInstance.drive(), 150);
}
