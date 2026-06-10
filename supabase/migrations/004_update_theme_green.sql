-- Update theme color from red to green (run if DB already seeded with old theme)
UPDATE settings
SET value = jsonb_set(value, '{primary}', '"#16A34A"')
WHERE key = 'theme_settings';
