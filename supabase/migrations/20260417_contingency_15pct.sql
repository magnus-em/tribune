-- Update default contingency to 15% (new cases only; existing cases keep their stored value)
ALTER TABLE cases ALTER COLUMN contingency_pct SET DEFAULT 15;
