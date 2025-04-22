import { FunctionDeclaration, Type } from "@google/genai"

export const getTrackingState = (): FunctionDeclaration => {
  const trackingStateFunction: FunctionDeclaration = {
    name: "obtener_estado_paquete",
    description: "Esto es una funcion que me obtiene el estado del paquete",
    parameters: {
      type: Type.OBJECT,
      description:
        "Numero de guia mediante el cual vamos a buscar el estado de una guia",
      properties: {
        trackingNumber: {
          type: Type.STRING,
          description: "Numero de guia/tracking del paquete",
        },
      },
      required: ["trackingNumber"],
    },
  }

  return trackingStateFunction
}

export async function obtenerEstadoDelPaqueteDesdeAPI(
  tracking: string
): Promise<any> {
  // console.log(`Llamando a la API de seguimiento para el número: ${tracking}`)

  await new Promise((resolve) => setTimeout(resolve, 1500))

  if (tracking === "234553") {
    return {
      estado: "En tránsito",
      ubicacion_actual: "Ciudad de Panamá",
      fecha_actualizacion: "2025-04-21T19:28:00Z",
      detalles:
        "El paquete está siendo procesado en el centro de distribución local.",
    }
  } else if (tracking === "987654") {
    return {
      estado: "Entregado",
      ubicacion_entrega: "Ciudad de Panamá",
      fecha_entrega: "2025-04-21T14:00:00Z",
      firmado_por: "J. Pérez",
    }
  } else {
    return {
      estado: "No encontrado",
      mensaje: `No se encontró información para el número de guía ${tracking}.`,
    }
  }
}
