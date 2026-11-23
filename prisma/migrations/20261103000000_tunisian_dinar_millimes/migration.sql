-- Monetary values were stored in hundredths. Convert them to Tunisian millimes
-- so the same displayed amount is preserved with three decimal places.
UPDATE "products" SET "price_cents" = "price_cents" * 10;
UPDATE "supplier_offers" SET "unit_price_cents" = "unit_price_cents" * 10;
UPDATE "purchase_orders" SET "total_cents" = "total_cents" * 10;
UPDATE "purchase_items" SET "unit_price_cents" = "unit_price_cents" * 10;
UPDATE "sales_orders" SET "total_cents" = "total_cents" * 10;
UPDATE "sales_items" SET "unit_price_cents" = "unit_price_cents" * 10;
UPDATE "invoices" SET "total_cents" = "total_cents" * 10;
UPDATE "invoice_items" SET "unit_price_cents" = "unit_price_cents" * 10;
UPDATE "payments" SET "amount_cents" = "amount_cents" * 10;
