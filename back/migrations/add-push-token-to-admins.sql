-- Agrega campo pushToken a la tabla admins para notificaciones push (Expo)
-- Cada admin registra su device token al loguearse desde la app mobile

ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS "pushToken" VARCHAR(500);

COMMENT ON COLUMN admins."pushToken" IS 'Expo push notification token del dispositivo mobile del admin';
