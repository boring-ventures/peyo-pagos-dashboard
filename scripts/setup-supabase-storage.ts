#!/usr/bin/env tsx

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Cargar variables de entorno
config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Faltan variables de entorno necesarias:");
  if (!supabaseUrl) console.error("- NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseAnonKey) console.error("- NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

// Crear cliente de Supabase con service key (usando anon key que es service role)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupStorage() {
  console.log("🚀 Configurando Supabase Storage...\n");

  try {
    // 1. Listar buckets existentes
    console.log("📋 Verificando buckets existentes...");
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      console.error("❌ Error listando buckets:", listError.message);
      console.error("💡 Error de permisos en Supabase");
      process.exit(1);
      return;
    }

    console.log(
      "✅ Buckets encontrados:",
      buckets?.map((b) => b.name).join(", ") || "ninguno"
    );

    // 2. Verificar si existe el bucket 'documents'
    const documentsBucket = buckets?.find(
      (bucket) => bucket.name === "documents"
    );

    if (documentsBucket) {
      console.log("✅ Bucket 'documents' ya existe");
    } else {
      console.log("🔧 Creando bucket 'documents'...");

      const { data: createData, error: createError } =
        await supabase.storage.createBucket("documents", {
          public: true,
          allowedMimeTypes: [
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/webp",
            "application/pdf",
          ],
          fileSizeLimit: 26214400, // 25MB
        });

      if (createError) {
        console.error("❌ Error creando bucket:", createError.message);

        console.error("💡 Error de permisos al crear bucket");
        return false;
        return false;
      } else {
        console.log("✅ Bucket 'documents' creado exitosamente");
      }
    }

    // 3. Verificar políticas de storage
    console.log("\n📋 Verificando acceso al bucket...");

    // Intentar listar objetos en el bucket
    const { data: objects, error: objectsError } = await supabase.storage
      .from("documents")
      .list("", { limit: 1 });

    if (objectsError) {
      console.warn(
        "⚠️  Advertencia accediendo al bucket:",
        objectsError.message
      );
    } else {
      console.log("✅ Acceso al bucket 'documents' verificado");
    }

    // 4. Probar subida de archivo de prueba
    console.log("\n🧪 Probando subida de archivo de prueba...");

    const testImageBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFPklEQVR4nO2dS2wUZRjGn5md3e622623lhYKFkqhINRWY0CjxhtqjBdiolGJGhONxpNoYjReEhONJkZjPBgTDzYxJl4SEw9GE28YL6hRwYsKKFqgFWq33e5u2+3uzM+MO9/OzndZZmdmdqd/k5ds25n5v+f5vv+87+3vW0IIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIISQ8WJIkLZckqV2SpA5JkhplWW6QJKlOkqRaSZJqJEmqkSSpWpKkKkmSKiVJqrA+W24d02EdWyVJUrUsyxWyLI/JsjwsyzIvy/KwLMtDkiQNWceNyLI8LEvyiCzLI7IsD0uSNGT93xG7Hkxfsr6nwvp9ldbvrrJ+v8P6HQ7rGqy/xWH9XS2yLDfKstxq/Z2ttizLLbIst8qy3CLLcosta3yf9T3tltVhn7ftdXxnCF3wG9YtdGa/+/G//XE6Bs9f3bqgKNe6v9DvyqxzO+06d1ltoOKsNtRu/23t1t/bbv3t7bIs66bfO8sNi6ZpMklKJhNKoSBnGw2qJCVz/VyuK5VKDaVSqe4kJXsN59j/OzQ01JNMJnsxz9OnT3fHPaY6nU73JhKJHkwczJ6envZEItGTSCT6Mcdg5XI5rVKppLFyqVRKY+ahhDnOOjZjvwrOsc85z8fYx5g5tVpNJxKJJJZKJZNGbkMoiqJqRhxNV6tVVdM0H9YA5mg86zjmGLPdPqdd5074lbPONYD5jb9xD+b/N//3bXLLZVvPQMfhOJ8N1fmYuyGwJH1vOW0xhkwwwpIdFTBwJkOZzWa1EolEr20oKJNM0Y31/TJJ1/sT9vG4EQUNdBrm9+DGwH5YnI0uUCaTyRo1RqRsI0OOKBBEcP2w6KJkL1dM7Hee6y5YeU4hGz9iM0bfYh7+3mTSKdewOIetMFjBHo9uF6RSqaxtNL2I8qk0t80PN5Ct3x5EOjJllEql+nw24xAWWyCUfofGCX05+2cP4DiHgYW1vGC7AWm6ruKmf1AjHObOhJFJpVIGlgXyxMCNZddhTlR1aXECWcVEcpYkCyub+vUJ4+rT6bS1IJgxFd2MU6lUn7+SnDZdNIiA7WGYOdVoLp2rO2OEcOOJJ3/4i3fffe8bTwfYz5eHzUw4x3Ac8zicb37BpvY7WlmPfPXVV8xzfZuTz+e9xrTBBgpMo7Lc6qiCqAd8nzWZXo8gywDEGf5aOTywP40vv/zytPeT53kJIFYWYQ9lOC/POAEkNDZzwYUJYp5gIl9k2cyCwDwjdIW5mWRD6LPFcGGM48OMIFhQwqJA/jBkiWWEz6fzXJxjDbJA0OzBa97S7Oy0n58w5i8ZJWHGEdwwJGwowzfmVwfChZllzFIiWVh1CxgKZFw/jGHmIFGCMVZwn0Qj3DShY8tF3Hx/I4zZ2OJHgC/EUNhZM+Zg5sJtxqzsQcbUmDGxr53x6g8tnEGKO1PcYuyGK0YsHe5AtsNO6IjHe54EucaV5chaDWGIf4YE2ZD6YIgxZWaZY3Gm5vwOhgCWaUHhT1EM3zJzNhw44xjGHLNOl5OLnLpDWQgU7LYgOEWOCXaTJINXr/o8vDbVLCR4kA7Y3pjH4czYWnzUCrNZYYfXX/EE5z04U0ixuauwOy0qgYV6AHmNdWqtlZKAGXhDYFb9g7NYuMTHpbC6lz1PoOKJdY1jrCxD2cOaOGCxZx+gx42wjFAkKOyNJa3YpvMhfr3KiWRZaJB7lYYwmGOhiZWHqGDNRgkhhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQYlH/AwTsVsUdYSuqAAAAAElFTkSuQmCC";
    const testImageBuffer = Buffer.from(testImageBase64, "base64");
    const testPath = `test-uploads/test-${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(testPath, testImageBuffer, {
        contentType: "image/png",
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error(
        "❌ Error subiendo archivo de prueba:",
        uploadError.message
      );
      console.log("💡 Esto podría deberse a permisos o configuración de RLS");
      return false;
    } else {
      console.log("✅ Subida de archivo de prueba exitosa");

      // Limpiar archivo de prueba
      const { error: deleteError } = await supabase.storage
        .from("documents")
        .remove([testPath]);

      if (deleteError) {
        console.warn(
          "⚠️  No se pudo eliminar archivo de prueba:",
          deleteError.message
        );
      }
    }

    console.log("\n🎉 Configuración de Supabase Storage completada!");
    console.log("✅ El bucket 'documents' está listo para usar");

    return true;
  } catch (error) {
    console.error("❌ Error durante la configuración:", error);
    return false;
  }
}

// Ejecutar configuración
setupStorage()
  .then((success) => {
    if (success) {
      console.log(
        "\n🚀 Ahora puedes ejecutar el seed script con imágenes funcionando"
      );
      process.exit(0);
    } else {
      console.log(
        "\n⚠️  Configuración incompleta, pero el seed script puede continuar"
      );
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("❌ Error fatal:", error);
    process.exit(1);
  });
