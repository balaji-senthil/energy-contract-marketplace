INSERT INTO contracts (energy_type, quantity_mwh, price_per_mwh, delivery_start, delivery_end, location, status)
VALUES
  ('Solar', 500.00, 45.50, '2026-03-01', '2026-05-31', 'California', 'Available'),
  ('Wind', 1200.00, 38.75, '2026-04-01', '2026-09-30', 'Texas', 'Available'),
  ('Natural Gas', 800.00, 52.00, '2026-02-15', '2026-08-15', 'Northeast', 'Available'),
  ('Hydro', 300.00, 41.25, '2026-01-15', '2026-04-15', 'Pacific Northwest', 'Available'),
  ('Nuclear', 1500.00, 60.00, '2026-06-01', '2026-12-31', 'Midwest', 'Available'),
  ('Coal', 950.00, 48.90, '2026-02-01', '2026-07-31', 'Appalachia', 'Reserved'),
  ('Solar', 250.00, 47.10, '2026-05-01', '2026-06-30', 'Arizona', 'Available'),
  ('Wind', 700.00, 40.00, '2026-03-15', '2026-10-15', 'Great Plains', 'Available'),
  ('Natural Gas', 600.00, 50.50, '2026-04-10', '2026-09-10', 'Gulf Coast', 'Available'),
  ('Hydro', 420.00, 39.80, '2026-02-20', '2026-05-20', 'Canada East', 'Available'),
  ('Solar', 980.00, 44.20, '2026-07-01', '2026-11-30', 'Nevada', 'Sold'),
  ('Nuclear', 1100.00, 58.75, '2026-08-01', '2027-01-31', 'Southeast', 'Available'),
  ('Solar', 1200.00, 85.75, '2026-11-01', '2027-02-28', 'Southwest', 'Available'),
  ('Wind', 1300.00, 95.75, '2026-12-01', '2027-03-28', 'Northwest', 'Available'),
  ('Natural Gas', 1400.00, 105.75, '2027-01-01', '2027-04-28', 'Midwest', 'Available');