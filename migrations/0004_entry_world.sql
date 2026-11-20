-- Store the validated FFXIV Home World separately from the character name.
-- Existing entries remain valid with a NULL world until migrated or re-signed.
ALTER TABLE entries ADD COLUMN world TEXT;
