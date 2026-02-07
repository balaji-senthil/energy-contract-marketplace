# Backend Tests

This backend uses pytest with async support and an in-memory-style SQLite database for API tests.

## Setup

Create a Python 3.11 virtual environment and install dependencies:

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

If you encounter SSL certificate errors while installing, use:

```bash
python -m pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org -r requirements.txt
```

## Run Tests

```bash
cd backend
source .venv/bin/activate
pytest
```

Run a single file:

```bash
pytest tests/test_contracts_endpoints.py
```

Run a single test:

```bash
pytest tests/test_contracts_endpoints.py -k test_compare_contracts_returns_metrics
```

## Coverage

Generate a coverage report (requires `pytest-cov`):

```bash
pytest --cov=app --cov-report=term-missing
```

## Latest Results

```bash
pytest
```

```
============================= test session starts ==============================
platform darwin -- Python 3.11.5, pytest-9.0.2, pluggy-1.6.0
rootdir: /Users/balajisenthilkumar/Personal projects/fs/energy-contract-marketplace/backend
configfile: pytest.ini
testpaths: tests
plugins: anyio-4.12.1, asyncio-1.3.0, cov-7.0.0
asyncio: mode=Mode.AUTO, debug=False, asyncio_default_fixture_loop_scope=None, asyncio_default_test_loop_scope=function
collected 26 items

tests/test_contracts_endpoints.py ................                       [ 61%]
tests/test_portfolios_endpoints.py ..........                            [100%]

============================== 26 passed in 0.91s ==============================
```

### Coverage Run

```bash
pytest --cov=app --cov-report=term-missing
```

```
============================= test session starts ==============================
platform darwin -- Python 3.11.5, pytest-9.0.2, pluggy-1.6.0
rootdir: /Users/balajisenthilkumar/Personal projects/fs/energy-contract-marketplace/backend
configfile: pytest.ini
testpaths: tests
plugins: anyio-4.12.1, asyncio-1.3.0, cov-7.0.0
asyncio: mode=Mode.AUTO, debug=False, asyncio_default_fixture_loop_scope=None, asyncio_default_test_loop_scope=function
collected 26 items

tests/test_contracts_endpoints.py ................                       [ 61%]
tests/test_portfolios_endpoints.py ..........                            [100%]

================================ tests coverage ================================
_______________ coverage: platform darwin, python 3.11.5-final-0 _______________

Name                                 Stmts   Miss  Cover   Missing
------------------------------------------------------------------
app/__init__.py                          0      0   100%
app/db.py                                9      2    78%   16-17
app/main.py                             19     19     0%   1-37
app/models.py                           39      0   100%
app/routers/contracts.py                65      3    95%   141, 158, 168
app/routers/portfolios.py               31      1    97%   42
app/schemas.py                         114      7    94%   35, 66-68, 100, 106, 112
app/services/contracts_service.py       70     21    70%   18, 22, 24, 26, 28, 30, 32, 34, 36, 38-39, 48, 52, 54, 56, 63, 70, 86-87, 97-98
app/services/portfolios_service.py      70      8    89%   22, 53, 78-80, 137-139
------------------------------------------------------------------
TOTAL                                  417     61    85%
============================== 26 passed in 0.91s ==============================
```

## Notes

- Tests use `httpx.ASGITransport` to exercise the FastAPI app in-process.
- A temporary SQLite database is created per test session for isolation.
- `DATABASE_URL` is set in `tests/conftest.py` to avoid touching Postgres.
