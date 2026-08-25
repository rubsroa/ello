-- Enforce at-most-one delivery record per booking, recipient and template.
ALTER TABLE `EmailLog`
  ADD CONSTRAINT `EmailLog_bookingId_recipient_template_key`
  UNIQUE (`bookingId`, `recipient`, `template`);
