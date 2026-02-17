-- Set default deposit settings: require_deposit=true, deposit_percentage=100
ALTER TABLE salons ALTER COLUMN require_deposit SET DEFAULT true;
ALTER TABLE salons ALTER COLUMN deposit_percentage SET DEFAULT 100;

-- Update existing salons that don't have deposit settings configured
UPDATE salons 
SET require_deposit = true, deposit_percentage = 100 
WHERE require_deposit IS NULL OR require_deposit = false;
