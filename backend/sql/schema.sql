CREATE TABLE IF NOT EXISTS contracts (
  id SERIAL PRIMARY KEY,
  energy_type VARCHAR(50) NOT NULL,
  quantity_mwh NUMERIC(18, 3) NOT NULL,
  price_per_mwh NUMERIC(18, 6) NOT NULL,
  delivery_start DATE NOT NULL,
  delivery_end DATE NOT NULL,
  location VARCHAR(80) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Available'
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80)
);

CREATE TABLE IF NOT EXISTS portfolios (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id SERIAL PRIMARY KEY,
  portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_portfolio_contract UNIQUE (portfolio_id, contract_id)
);

CREATE INDEX IF NOT EXISTS idx_contracts_energy_type ON contracts (energy_type);
CREATE INDEX IF NOT EXISTS idx_contracts_location ON contracts (location);
CREATE INDEX IF NOT EXISTS idx_contracts_delivery_dates ON contracts (delivery_start, delivery_end);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios (user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_portfolio_id ON portfolio_holdings (portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_contract_id ON portfolio_holdings (contract_id);