BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    -- Créer l'association avec les droits étendus
    INSERT INTO profile_location_associations (
      profile_id, location_id, is_verified, is_active
    )
    VALUES (
      NEW.requester_id, NEW.location_id, TRUE, TRUE
    )
    ON CONFLICT (profile_id, location_id) 
    DO UPDATE SET is_verified = TRUE, is_active = TRUE;
  END IF;
  RETURN NEW;
END;
