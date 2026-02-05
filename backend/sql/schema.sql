CREATE TABLE IF NOT EXISTS contracts (
  id SERIAL PRIMARY KEY,
  energy_type VARCHAR(50) NOT NULL,
  quantity_mwh DOUBLE PRECISION NOT NULL,
  price_per_mwh DOUBLE PRECISION NOT NULL,
  delivery_start DATE NOT NULL,
  delivery_end DATE NOT NULL,
  location VARCHAR(80) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Available'
);

CREATE INDEX IF NOT EXISTS idx_contracts_energy_type ON contracts (energy_type);
CREATE INDEX IF NOT EXISTS idx_contracts_location ON contracts (location);
CREATE INDEX IF NOT EXISTS idx_contracts_delivery_dates ON contracts (delivery_start, delivery_end);
