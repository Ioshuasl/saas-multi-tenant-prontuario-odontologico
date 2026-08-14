-- Reusa session_name global (ex.: WAHA_SESSION_NAME=Ioshua) sem P2002 entre tenants de smoke/dev.

CREATE OR REPLACE FUNCTION platform.upsert_whatsapp_account_for_session(
  p_id uuid,
  p_tenant_id uuid,
  p_session_name text,
  p_risk_accepted_at timestamptz,
  p_unit_id uuid,
  p_status text,
  p_last_error text,
  p_display_phone text
)
RETURNS TABLE (
  id uuid,
  session_name text,
  display_phone text,
  status text,
  kill_switch boolean,
  last_error text,
  risk_accepted_at timestamptz,
  webhook_verified_at timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  held_id uuid;
  held_tenant uuid;
  mine_id uuid;
  mine_phone text;
BEGIN
  SELECT wa.id, wa.tenant_id INTO held_id, held_tenant
  FROM whatsapp_account wa
  WHERE wa.session_name = p_session_name
  LIMIT 1;

  SELECT wa.id, wa.display_phone INTO mine_id, mine_phone
  FROM whatsapp_account wa
  WHERE wa.tenant_id = p_tenant_id
  LIMIT 1;

  IF held_id IS NOT NULL AND held_tenant IS DISTINCT FROM p_tenant_id THEN
    IF mine_id IS NULL THEN
      UPDATE whatsapp_account wa
      SET
        tenant_id = p_tenant_id,
        unit_id = p_unit_id,
        risk_accepted_at = p_risk_accepted_at,
        status = p_status,
        last_error = p_last_error,
        display_phone = COALESCE(p_display_phone, wa.display_phone),
        kill_switch = false,
        updated_at = now()
      WHERE wa.id = held_id;
      mine_id := held_id;
    ELSE
      UPDATE whatsapp_account
      SET session_name = 'released_' || replace(id::text, '-', ''),
          updated_at = now()
      WHERE id = held_id;

      UPDATE whatsapp_account
      SET
        session_name = p_session_name,
        unit_id = p_unit_id,
        risk_accepted_at = p_risk_accepted_at,
        status = p_status,
        last_error = p_last_error,
        display_phone = COALESCE(p_display_phone, display_phone),
        kill_switch = false,
        updated_at = now()
      WHERE id = mine_id;
    END IF;
  ELSIF mine_id IS NOT NULL THEN
    UPDATE whatsapp_account
    SET
      session_name = p_session_name,
      unit_id = p_unit_id,
      risk_accepted_at = p_risk_accepted_at,
      status = p_status,
      last_error = p_last_error,
      display_phone = COALESCE(p_display_phone, display_phone),
      kill_switch = false,
      updated_at = now()
    WHERE id = mine_id;
  ELSE
    INSERT INTO whatsapp_account (
      id, tenant_id, session_name, unit_id, risk_accepted_at, status, last_error, display_phone, kill_switch
    ) VALUES (
      p_id, p_tenant_id, p_session_name, p_unit_id, p_risk_accepted_at, p_status, p_last_error, p_display_phone, false
    );
    mine_id := p_id;
  END IF;

  RETURN QUERY
  SELECT
    wa.id,
    wa.session_name,
    wa.display_phone,
    wa.status,
    wa.kill_switch,
    wa.last_error,
    wa.risk_accepted_at,
    wa.webhook_verified_at,
    wa.created_at
  FROM whatsapp_account wa
  WHERE wa.id = mine_id;
END;
$$;

REVOKE ALL ON FUNCTION platform.upsert_whatsapp_account_for_session(uuid, uuid, text, timestamptz, uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION platform.upsert_whatsapp_account_for_session(uuid, uuid, text, timestamptz, uuid, text, text, text) TO app_user;
