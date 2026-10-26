"""Landshop document worker foundation. No public imports activated."""
from fastapi import FastAPI
app = FastAPI(title='Landshop Document Worker', docs_url=None, redoc_url=None)
@app.get('/health')
def health():
    return {'status':'ok', 'service':'landshop-document-worker', 'imports_enabled':False}
