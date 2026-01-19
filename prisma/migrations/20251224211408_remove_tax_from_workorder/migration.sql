SET @col := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'workorder'
    AND COLUMN_NAME = 'tax'
);

SET @sql := IF(@col > 0,
  'ALTER TABLE `workorder` DROP COLUMN `tax`;',
  'SELECT 1;'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
