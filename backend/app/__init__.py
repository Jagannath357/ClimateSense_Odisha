import sys
from pathlib import Path

# 1. Ensure project root is always in sys.path
_root = Path(__file__).resolve().parents[2]
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

# 2. Automatically link ml/.venv site-packages if running with global or conda interpreter
_venv_site_packages = _root / "ml" / ".venv" / "Lib" / "site-packages"
if _venv_site_packages.exists() and str(_venv_site_packages) not in sys.path:
    sys.path.insert(1, str(_venv_site_packages))
