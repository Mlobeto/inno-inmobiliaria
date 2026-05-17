-- Migration: add new enum values to enum_Property_legalStatus
-- Run once against the production database

ALTER TYPE "enum_Property_legalStatus" ADD VALUE IF NOT EXISTS 'SUCCESSION';
ALTER TYPE "enum_Property_legalStatus" ADD VALUE IF NOT EXISTS 'ADVERSE_POSSESSION_IN_PROCESS';
ALTER TYPE "enum_Property_legalStatus" ADD VALUE IF NOT EXISTS 'CONDOMINIUM';
ALTER TYPE "enum_Property_legalStatus" ADD VALUE IF NOT EXISTS 'DONATION';
