-- Phase 5: Add OTP authentication support fields
-- tech_password_encrypted: Stores encrypted technical password for phone-based auth
-- auth_method_otp: Tracks if user authenticated via OTP

ALTER TABLE "utilisateur" ADD COLUMN "tech_password_encrypted" TEXT;
ALTER TABLE "utilisateur" ADD COLUMN "auth_method_otp" BOOLEAN NOT NULL DEFAULT false;
