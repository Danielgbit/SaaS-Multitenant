-- Fix: Do not create organization for invited employees
-- If user already has an employee record with user_id, skip org creation

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    is_invited_employee BOOLEAN;
BEGIN
    -- Check if this user is already linked to an employee (i.e., invited employee)
    SELECT EXISTS(
        SELECT 1 FROM employees WHERE user_id = NEW.id
    ) INTO is_invited_employee;

    -- If user is an invited employee, skip organization creation
    IF is_invited_employee THEN
        RAISE NOTICE 'User % is an invited employee, skipping org creation', NEW.id;
        RETURN NEW;
    END IF;

    -- 1. Create Organization
    INSERT INTO public.organizations (name, slug)
    VALUES (
        COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'),
        COALESCE(NEW.raw_user_meta_data->>'slug', 'biz-' || extract(epoch from now())::text)
    ) RETURNING id INTO new_org_id;

    -- 2. Add Owner Member
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (new_org_id, NEW.id, 'owner');

    -- 3. Add default Booking Settings (Using ID directly as it's PK)
    INSERT INTO public.booking_settings (
        organization_id, slot_interval, buffer_minutes, max_days_ahead, min_notice_hours, timezone, online_booking_enabled
    ) VALUES (
        new_org_id, 30, 0, 60, 24, 'UTC', true
    );

    -- 4. Add disabled WhatsApp Integration
    INSERT INTO public.integrations (organization_id, type, status)
    VALUES (new_org_id, 'whatsapp', 'disabled');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;