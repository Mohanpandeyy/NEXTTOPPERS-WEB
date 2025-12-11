-- Update videos bucket to allow 1GB files (1073741824 bytes)
UPDATE storage.buckets 
SET file_size_limit = 1073741824 
WHERE id = 'videos';