import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreatePartnerPayload {
  username: string;
  displayName: string;
  password: string;
  isActive?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Yetkilendirme başlığı (Authorization header) eksik." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Sunucu konfigürasyonu eksik (SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY)." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Client using caller's JWT to verify caller user & admin status
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify caller user authentication
    const { data: { user: callerUser }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !callerUser) {
      return new Response(
        JSON.stringify({ error: "Oturum doğrulanamadı. Lütfen tekrar giriş yapın." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify server-side admin role
    const isAppAdmin = callerUser.app_metadata?.role === "admin";
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUser.id)
      .maybeSingle();

    const isDbAdmin = roleData?.role === "admin";

    if (!isAppAdmin && !isDbAdmin) {
      return new Response(
        JSON.stringify({ error: "Yetkisiz erişim: Bu işlemi gerçekleştirmek için yönetici yetkisi gereklidir." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse payload
    const payload: CreatePartnerPayload = await req.json();
    const cleanUsername = (payload.username || "").trim().toLowerCase();
    const cleanDisplayName = (payload.displayName || "").trim();
    const password = payload.password || "";
    const isActive = payload.isActive ?? true;

    if (!cleanUsername) {
      return new Response(
        JSON.stringify({ error: "Kullanıcı adı boş bırakılamaz." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!cleanDisplayName) {
      return new Response(
        JSON.stringify({ error: "Firma / Görünen ad boş bırakılamaz." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!password || password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Başlangıç şifresi en az 6 karakter uzunluğunda olmalıdır." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Admin client with service_role key (server-side privileged execution)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Check if partner username already exists
    const { data: existingPartner } = await supabaseAdmin
      .from("partners")
      .select("id")
      .eq("username", cleanUsername)
      .maybeSingle();

    if (existingPartner) {
      return new Response(
        JSON.stringify({ error: "Bu kullanıcı adı zaten başka bir partner tarafından kullanılıyor." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const email = `${cleanUsername}@partner.eternalproduction.net`;

    // 1. Create user in auth.users via Admin API
    const { data: authResult, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: "partner", provider: "email", providers: ["email"] },
      user_metadata: { username: cleanUsername, display_name: cleanDisplayName },
    });

    if (createAuthError || !authResult.user) {
      return new Response(
        JSON.stringify({ error: `Auth kullanıcısı oluşturulamadı: ${createAuthError?.message || "Bilinmeyen hata"}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newAuthUserId = authResult.user.id;

    // 2. Insert into public.user_roles
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: newAuthUserId, role: "partner" }, { onConflict: "user_id" });

    // 3. Insert into public.partners
    const { data: partnerRecord, error: partnerInsertError } = await supabaseAdmin
      .from("partners")
      .insert({
        auth_user_id: newAuthUserId,
        username: cleanUsername,
        display_name: cleanDisplayName,
        is_active: isActive,
      })
      .select("id, username, display_name, is_active, created_at")
      .single();

    if (partnerInsertError || !partnerRecord) {
      return new Response(
        JSON.stringify({ error: `Partner kaydı oluşturulamadı: ${partnerInsertError?.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Insert initial partner status
    await supabaseAdmin.from("partner_status").insert({
      partner_id: partnerRecord.id,
      status: "Normal",
      description: "Yeni partner hesabı Edge Function üzerinden oluşturuldu.",
      required_action: "",
      updated_by: callerUser.id,
    });

    // 5. Insert audit log
    await supabaseAdmin.from("audit_logs").insert({
      actor_user_id: callerUser.id,
      action: "ADMIN_CREATE_PARTNER_EDGE_FUNCTION",
      entity_type: "partners",
      entity_id: partnerRecord.id,
      metadata: { username: cleanUsername, is_active: isActive },
    });

    return new Response(
      JSON.stringify({
        success: true,
        partnerId: partnerRecord.id,
        authUserId: newAuthUserId,
        username: cleanUsername,
        displayName: cleanDisplayName,
        isActive: partnerRecord.is_active,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Sunucu hatası";
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
