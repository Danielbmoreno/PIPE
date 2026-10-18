"""Read-only secret checks. Values and HTTP bodies are never logged or saved.

Writes redacted evidence only under ignored .local/. No production mutations.
Use --verify-remote to test known service keys against this project's read-only
Auth admin endpoint. A 401 does not prove a signing secret has been revoked.
"""
import base64
import hashlib
import hmac
import json
from pathlib import Path
import re
import subprocess
import sys
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
PROJECT = 'mkapcbpocvznfannrjcy'
URL = f'https://{PROJECT}.supabase.co'
JWT = re.compile(r'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+')
SIGNING = re.compile(r'''(?im)^\s*JWT_SECRET\s*[=:]\s*["']?([^\s"'#;,]+)''')
SECRET = re.compile(r'sb_secret_[A-Za-z0-9_-]{15,}')
found = {}

def git(*args):
    return subprocess.run(['git', *args], cwd=ROOT, capture_output=True, check=True).stdout

def register(value, kind, source, claims=None):
    fingerprint = hashlib.sha256(value.encode()).hexdigest()
    item = found.setdefault(fingerprint, {'kind': kind, 'sources': set(), 'value': value, 'claims': claims})
    item['sources'].add(source)

def inspect(text, source):
    for token in JWT.findall(text):
        try:
            part = token.split('.')[1]
            claims = json.loads(base64.urlsafe_b64decode(part + '=' * (-len(part) % 4)))
        except (ValueError, UnicodeError):
            continue
        if claims.get('role') == 'service_role':
            register(token, 'service_role', source, {'ref': claims.get('ref'), 'exp': claims.get('exp')})
    for value in SECRET.findall(text):
        register(value, 'secret_key', source)
    for value in SIGNING.findall(text):
        if value.lower() not in {'your_jwt_secret', 'tu_jwt_secret', 'changeme', 'example', 'fixture', 'supersecretpipe'}:
            register(value, 'jwt_secret_candidate', source)

objects = git('rev-list', '--objects', '--all').decode().splitlines()
blob_count = 0
proc = subprocess.Popen(['git', 'cat-file', '--batch'], cwd=ROOT, stdin=subprocess.PIPE, stdout=subprocess.PIPE)
for row in objects:
    oid, _, path = row.partition(' ')
    proc.stdin.write((oid + '\n').encode()); proc.stdin.flush()
    header = proc.stdout.readline().decode().split()
    if len(header) != 3:
        continue
    size = int(header[2]); content = proc.stdout.read(size); proc.stdout.read(1)
    if header[1] == 'blob':
        blob_count += 1
        inspect(content.decode('utf-8', errors='replace'), f'history:{oid}:{path}')
proc.stdin.close(); proc.wait()

files = git('ls-files', '--cached', '--others', '--exclude-standard', '-z').decode().split('\0')
for name in files:
    path = ROOT / name
    if name and path.is_file() and path.stat().st_size < 3_000_000:
        inspect(path.read_text(encoding='utf-8', errors='replace'), f'worktree:{name}')
for name in ['.env', '.env.local', 'frontend/.env', 'frontend/.env.local']:
    path = ROOT / name
    if path.exists():
        inspect(path.read_text(encoding='utf-8'), f'local-config:{name}')

def status_get(path, token):
    request = urllib.request.Request(URL + path, headers={'apikey': token, 'Authorization': 'Bearer ' + token})
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return response.status
    except urllib.error.HTTPError as error:
        return error.code
    except (urllib.error.URLError, TimeoutError):
        return 'network_error'

results = []
for fingerprint, item in found.items():
    entry = {'sha256': fingerprint, 'kind': item['kind'], 'sources': sorted(item['sources']), 'claims': item['claims']}
    if '--verify-remote' in sys.argv and item['kind'] == 'service_role' and item['claims'].get('ref') == PROJECT:
        entry['read_only_auth_admin_http'] = status_get('/auth/v1/admin/users?page=1&per_page=1', item['value'])
        entry['read_only_rest_http'] = status_get('/rest/v1/roles?select=id&limit=1', item['value'])
    if item['kind'] == 'jwt_secret_candidate':
        matches = []
        for token in found.values():
            if token['kind'] != 'service_role':
                continue
            encoded, signature = token['value'].rsplit('.', 1)
            expected = base64.urlsafe_b64encode(hmac.new(item['value'].encode(), encoded.encode(), hashlib.sha256).digest()).rstrip(b'=').decode()
            matches.append(hmac.compare_digest(expected, signature))
        entry['matches_observed_supabase_token_signature'] = any(matches)
        entry['known_consumer'] = 'Legacy Express controllers/authController.js and middleware/auth.js; not the GitHub Pages frontend'
    entry['status'] = 'REQUIRES_CONTROLLED_REVOCATION_REVIEW' if item['kind'] == 'jwt_secret_candidate' else 'REVIEW_REDACTED_EVIDENCE'
    results.append(entry)

report = {'project': PROJECT, 'git_blobs_inspected': blob_count, 'results': results,
          'scope': 'Reachable local Git history, publishable worktree and local environment files. No OS credential stores scanned.',
          'limitations': 'No JWTs were forged. 401 proves only rejection of that exact key at that endpoint; signing-secret revocation remains unverified.'}
destination = ROOT / '.local/approval/security-audit.json'
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
public_current = [r for r in results if any(s.startswith('worktree:') for s in r['sources'])]
print(json.dumps({'git_blobs_inspected': blob_count, 'distinct_sensitive_candidates': len(results),
                  'candidates_in_publishable_worktree': len(public_current),
                  'auth_read_only_statuses': [r.get('read_only_auth_admin_http') for r in results if 'read_only_auth_admin_http' in r],
                  'evidence': '.local/approval/security-audit.json'}))
