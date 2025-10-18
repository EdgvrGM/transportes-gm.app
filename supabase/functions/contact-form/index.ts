// Importa la función 'serve' para crear el servidor de la función.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// --- CONFIGURACIÓN ---
const TO_EMAIL = "ventas@transportesgm.mx";
const FROM_NAME = "Transportes GM - Sitio Web";
// ¡CAMBIO IMPORTANTE! Usa un correo de tu dominio verificado en Resend.
// Por ejemplo: 'ventas@transportesgm.mx', 'contacto@transportesgm.mx' o 'cotizaciones@transportesgm.mx'
const FROM_EMAIL = "cotizaciones@transportesgm.mx";

serve(async (req: Request) => {
  // Manejo de la solicitud pre-vuelo (CORS), necesario para que el navegador permita la llamada.
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*", // Permite llamadas desde cualquier dominio.
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Extrae los datos del formulario que envió la aplicación.
    const formData = await req.json();
    const { name, email, phone, company, message } = formData;

    // Construye el cuerpo del correo de forma legible.
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

    // Obtiene la clave secreta de Resend que guardaste en Supabase.
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error(
        "La clave de API de Resend no está configurada en los secretos de Supabase."
      );
    }

    // Llama a la API de Resend para enviar el correo.
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`, // Usa el email verificado.
        to: TO_EMAIL,
        subject: `Nueva Cotización de: ${name}`,
        text: emailBody,
        reply_to: email, // Permite que al darle "Responder", se responda al cliente.
      }),
    });

    const resendData = await resendResponse.json();

    // Si Resend devuelve un error, lo capturamos para informar a la app.
    if (resendData.error) {
      throw new Error(resendData.error.message);
    }

    // Si todo sale bien, enviamos una respuesta de éxito a la aplicación.
    return new Response(JSON.stringify({ message: "Correo enviado" }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 200,
    });
  } catch (error) {
    // Si algo falla, enviamos una respuesta de error detallada.
    const errorMessage =
      error instanceof Error ? error.message : "Ocurrió un error desconocido.";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 500,
    });
  }
});
