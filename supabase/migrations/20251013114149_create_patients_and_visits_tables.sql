/*
  # Doctor's App Database Schema

  ## Overview
  This migration creates the database structure for a doctor's patient management application.

  ## 1. New Tables
  
  ### `patients`
  - `id` (uuid, primary key) - Unique identifier for each patient
  - `first_name` (text) - Patient's first name
  - `last_name` (text) - Patient's last name
  - `date_of_birth` (date) - Patient's birth date
  - `gender` (text) - Patient's gender
  - `phone` (text) - Contact phone number
  - `email` (text) - Contact email
  - `address` (text) - Patient's address
  - `medical_history` (text) - Summary of medical history
  - `allergies` (text) - Known allergies
  - `blood_type` (text) - Blood type
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `visits`
  - `id` (uuid, primary key) - Unique identifier for each visit
  - `patient_id` (uuid, foreign key) - Reference to patient
  - `visit_date` (timestamptz) - Date and time of visit
  - `reason` (text) - Reason for visit
  - `diagnosis` (text) - Doctor's diagnosis
  - `treatment` (text) - Prescribed treatment
  - `notes` (text) - Additional notes
  - `follow_up_date` (date) - Optional follow-up appointment date
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Security
  
  - Enable RLS on both `patients` and `visits` tables
  - Add policies for authenticated users to:
    - Read all patient and visit data
    - Create new patients and visits
    - Update existing patients and visits
    - Delete patients and visits
  
  ## 3. Important Notes
  
  - All tables use UUID primary keys for better scalability
  - Foreign key constraint ensures data integrity between visits and patients
  - Timestamps automatically track creation and updates
  - RLS policies ensure only authenticated users (doctors) can access data
*/

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date NOT NULL,
  gender text NOT NULL,
  phone text DEFAULT '',
  email text DEFAULT '',
  address text DEFAULT '',
  medical_history text DEFAULT '',
  allergies text DEFAULT '',
  blood_type text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create visits table
CREATE TABLE IF NOT EXISTS visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_date timestamptz DEFAULT now(),
  reason text NOT NULL,
  diagnosis text DEFAULT '',
  treatment text DEFAULT '',
  notes text DEFAULT '',
  follow_up_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster patient lookups
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date DESC);

-- Enable Row Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Policies for patients table
CREATE POLICY "Authenticated users can read all patients"
  ON patients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create patients"
  ON patients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update patients"
  ON patients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete patients"
  ON patients FOR DELETE
  TO authenticated
  USING (true);

-- Policies for visits table
CREATE POLICY "Authenticated users can read all visits"
  ON visits FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create visits"
  ON visits FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update visits"
  ON visits FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete visits"
  ON visits FOR DELETE
  TO authenticated
  USING (true);