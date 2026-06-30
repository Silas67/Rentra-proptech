import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const VALID_DOC_TYPES = [
  "certificate_of_occupancy",
  "right_of_occupancy",
  "survey_plan",
  "deed_of_assignment",
  "governors_consent",
  "building_approval_plan",
  "tax_clearance_certificate",
  "other",
];

// Step 1b: called after the browser has already uploaded the file
// directly to the "verification-documents" Storage bucket (path
// "{requestId}/{filename}"). This registers the DB row — storagePath is
// stored in uploaded_documents.file_url, not a public URL, since the
// bucket is private. extracted_data stays null until the "Analyze" step
// (a separate edge function) runs Claude over it.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requestId, storagePath, docType } = await req.json();
    if (!requestId || !storagePath || !docType) {
      return jsonResponse({ error: "requestId, storagePath and docType are required" }, 400);
    }
    if (!VALID_DOC_TYPES.includes(docType)) {
      return jsonResponse({ error: "Invalid docType" }, 400);
    }
    if (!storagePath.startsWith(`${requestId}/`)) {
      return jsonResponse({ error: "storagePath must be inside the request's folder" }, 400);
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } }
    );

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return jsonResponse({ error: "Not authenticated" }, 401);
    }
    const userId = userData.user.id;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: request, error: requestError } = await adminClient
      .from("verification_requests")
      .select("id, status, created_by")
      .eq("id", requestId)
      .maybeSingle();

    if (requestError || !request) {
      return jsonResponse({ error: "Verification request not found" }, 404);
    }

    if (request.created_by !== userId) {
      return jsonResponse({ error: "Not authorized for this request" }, 403);
    }

    const { data: document, error: insertError } = await adminClient
      .from("uploaded_documents")
      .insert({ request_id: requestId, file_url: storagePath, doc_type: docType })
      .select()
      .single();

    if (insertError) {
      return jsonResponse({ error: insertError.message }, 500);
    }

    if (request.status === "PENDING") {
      await adminClient
        .from("verification_requests")
        .update({ status: "DOCS_UPLOADED" })
        .eq("id", requestId);
    }

    return jsonResponse({ data: document }, 201);
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
