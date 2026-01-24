-- Add worksheet and activity to the lesson_type enum
ALTER TYPE lesson_type ADD VALUE IF NOT EXISTS 'worksheet';
ALTER TYPE lesson_type ADD VALUE IF NOT EXISTS 'activity';