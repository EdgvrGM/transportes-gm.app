// Importa la función 'serve' para crear el servidor de la función.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// --- CONFIGURACIÓN ---
const TO_EMAIL = "ventas@transportesgm.mx";
const FROM_NAME = "Transportes GM - Sitio Web";
// ¡CAMBIO IMPORTANTE! Usa un correo de tu dominio verificado.
// Puedes usar 'ventas@...', 'contacto@...' o 'cotizaciones@...'
const FROM_EMAIL = "cotizaciones@transportesgm.mx";

serve(async (req: Request) => {
  // Manejo de la solicitud pre-vuelo (CORS)
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const formData = await req.json();
    const { name, email, phone, company, message } = formData;

    const emailBody = `
      Nueva Solicitud de Cotización
      --------------------------------
      Nombre: ${name}
      Email: ${email}
      Teléfono: ${phone || "No especificado"}
      Empresa: ${company || "No especificada"}
      --------------------------------
      Mensaje:
      ${message}
    `;

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("La clave de API de Resend no está configurada.");
    }

    // Llamada a la API de Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`, // <-- ¡CÓDIGO ACTUALIZADO!
        to: TO_EMAIL,
        subject: `Nueva Cotización de: ${name}`,
        text: emailBody,
        reply_to: email,
      }),
    });

    const resendData = await resendResponse.json();

    if (resendData.error) {
      throw new Error(resendData.error.message);
    }

    // Respuesta de éxito
    return new Response(JSON.stringify({ message: "Correo enviado" }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 200,
    });
  } catch (error) {
    // Respuesta de error
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 500,
    });
  }
});
