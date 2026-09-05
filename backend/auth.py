"""Firebase ID-token verification using public Google certificates only."""
import time
import httpx
import jwt
from cryptography import x509
from fastapi import Header, HTTPException
from config import get_settings

CERT_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
_certificates: dict = {}
_expires_at = 0.0

def signing_key(kid: str):
    global _certificates, _expires_at
    if time.time() >= _expires_at or kid not in _certificates:
        response = httpx.get(CERT_URL, timeout=10.0)
        response.raise_for_status()
        _certificates = response.json()
        # Respect Google's max-age; cap caching at one hour.
        max_age = 300
        for entry in response.headers.get('cache-control', '').split(','):
            if entry.strip().startswith('max-age='):
                max_age = max(0, min(3600, int(entry.strip().split('=')[1])))
        _expires_at = time.time() + max_age
    if kid not in _certificates:
        raise ValueError('Unknown signing key.')
    return x509.load_pem_x509_certificate(_certificates[kid].encode()).public_key()

def verify_token(token: str) -> str:
    settings = get_settings()
    header = jwt.get_unverified_header(token)
    if header.get('alg') != 'RS256' or not isinstance(header.get('kid'), str):
        raise ValueError('Invalid signing algorithm or key ID.')
    claims = jwt.decode(token, signing_key(header['kid']), algorithms=['RS256'],
        audience=settings.firebase_project_id,
        issuer=f'https://securetoken.google.com/{settings.firebase_project_id}',
        options={'require': ['exp', 'iat', 'aud', 'iss', 'sub', 'auth_time']})
    uid = claims['sub']
    if not isinstance(uid, str) or not 1 <= len(uid) <= 128:
        raise ValueError('Invalid subject.')
    now = time.time()
    for name in ('auth_time', 'iat', 'exp'):
        if type(claims[name]) not in (int, float):
            raise ValueError('Invalid token timestamp.')
    if claims['auth_time'] > now or claims['auth_time'] < 0:
        raise ValueError('Invalid authentication time.')
    return uid

def require_user(authorization: str | None = Header(default=None)) -> str | None:
    if not get_settings().require_auth:
        return None
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(401, 'Sign in with Google before using this endpoint.', headers={'WWW-Authenticate': 'Bearer'})
    token = authorization[7:]
    if not token or len(token) > 16000:
        raise HTTPException(401, 'Invalid Firebase ID token.')
    try:
        return verify_token(token)
    except httpx.HTTPError as exc:
        raise HTTPException(503, 'Authentication verification is temporarily unavailable.') from exc
    except (jwt.PyJWTError, ValueError, KeyError, TypeError) as exc:
        raise HTTPException(401, 'Firebase ID token is invalid or expired. Sign in again.', headers={'WWW-Authenticate': 'Bearer'}) from exc
