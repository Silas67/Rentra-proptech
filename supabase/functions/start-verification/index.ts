import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

// Step 1a of the verification workflow: an explicit "Start Verification"
// action by the property's landlord/agent, before any document is
// uploaded. Creates the single verification_requests row for a property
// (property_id is unique — see 20260627000000_create_verification_tables.sql).
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { propertyId } = await req.json();
    if (!propertyId) {
      return jsonResponse({ error: "propertyId is required" }, 400);
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

    const { data: property, error: propertyError } = await adminClient
      .from("properties")
      .select("id, landlord_id, agent_id")
      .eq("id", propertyId)
      .maybeSingle();

    if (propertyError || !property) {
      return jsonResponse({ error: "Property not found" }, 404);
    }

    if (property.landlord_id !== userId && property.agent_id !== userId) {
      return jsonResponse({ error: "Not authorized for this property" }, 403);
    }

    const { data: request, error: insertError } = await adminClient
      .from("verification_requests")
      .insert({ property_id: propertyId, created_by: userId, status: "PENDING" })
      .select()
      .single();

    if (insertError) {
      // Postgres unique_violation — a request already exists for this property.
      const status = insertError.code === "23505" ? 409 : 500;
      return jsonResponse({ error: insertError.message }, status);
    }

    return jsonResponse({ data: request }, 201);
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
