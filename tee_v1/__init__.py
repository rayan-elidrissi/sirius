"""
Substitute enclave microservice for local development.

This package exposes a FastAPI app that mimics the Nautilus TEE API used by
SIRIUS, but runs entirely on the developer machine in the clear.

The public entrypoint is `substitute_enclave.main:app`.
"""

__all__ = ["__version__"]

__version__ = "0.1.0"


