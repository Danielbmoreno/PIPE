"""Read-only release checks; --build uses existing public GitHub variables.

No env files are edited. Git credentials stay in process memory. Only hashes,
HTTP statuses and non-secret metadata are saved under ignored .local/.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request

ROOT=Path(__file__).resolve().parents[1]
PROJECT='mkapcbpocvznfannrjcy'
ORIGIN='https://danielbmoreno.github.io'
PAGE=ORIGIN+'/PIPE/'
report={'project':PROJECT,'production_writes':False}

def fetch(url, headers=None):
    request=urllib.request.Request(url,headers=headers or {})
    try:
        with urllib.request.urlopen(request,timeout=20) as response:
            return response.status,response.read()
    except urllib.error.HTTPError as error:
        return error.code,b''

try:
    env=dict(os.environ,GIT_TERMINAL_PROMPT='0',GCM_INTERACTIVE='Never')
    credential=subprocess.run(['git','credential','fill'],input='protocol=https\nhost=github.com\nusername=Danielbmoreno\n\n',text=True,capture_output=True,timeout=20,env=env)
    values=dict(line.split('=',1) for line in credential.stdout.splitlines() if '=' in line)
    token=values.get('password')
    if not token: raise RuntimeError('No hay una credencial GitHub local disponible para esta comprobación.')
    headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json'}
    status,body=fetch('https://api.github.com/repos/Danielbmoreno/PIPE/actions/variables',headers)
    if status!=200: raise RuntimeError('No se pudieron verificar las variables de GitHub Actions.')
    variables={v['name']:v['value'] for v in json.loads(body).get('variables',[])}
    url=variables.get('VITE_SUPABASE_URL','').rstrip('/')
    key=variables.get('VITE_SUPABASE_ANON_KEY','')
    if url!=f'https://{PROJECT}.supabase.co' or not key.startswith('sb_publishable_'):
        raise RuntimeError('Revisar la URL y el tipo de clave pública antes de continuar.')
    if any(re.search(r'SERVICE|SECRET|PASSWORD|PRIVATE|JWT',name) for name in variables if name.startswith('VITE_')):
        raise RuntimeError('Se encontró una variable VITE_ con nombre reservado para secretos.')
    report['github_variables']=[{'name':name,'sha256':hashlib.sha256(value.encode()).hexdigest(),'kind':'publishable' if name=='VITE_SUPABASE_ANON_KEY' else 'public_configuration'} for name,value in variables.items()]
    status,body=fetch('https://api.github.com/repos/Danielbmoreno/PIPE/actions/secrets',headers)
    report['github_secrets_http']=status
    report['github_secret_names']=[v['name'] for v in json.loads(body).get('secrets',[])] if status==200 else []
    api_headers={'apikey':key}
    status,body=fetch(url+'/auth/v1/settings',api_headers)
    report['auth_settings_http']=status
    if status!=200: raise RuntimeError('La clave pública no permite consultar la configuración Auth.')
    for table in ['usuarios','estudiantes','citas','alertas','casos','intervenciones']:
        status,body=fetch(url+'/rest/v1/'+table+'?select=id&limit=1',api_headers)
        exposed=status==200 and json.loads(body)!=[]
        report.setdefault('anonymous_checks',[]).append({'table':table,'http':status,'rows_exposed':exposed})
        if exposed: raise RuntimeError('El acceso anónimo expone registros; no publicar.')
    report['edge_unauthenticated_http']=fetch(url+'/functions/v1/create-student',api_headers)[0]
    status,body=fetch(url+'/auth/v1/.well-known/jwks.json',api_headers)
    report['jwks_http']=status
    if status==200: report['jwks_algorithms']=[v.get('alg') for v in json.loads(body).get('keys',[])]
    status,html=fetch(PAGE)
    report['pages_http']=status
    if status!=200: raise RuntimeError('GitHub Pages no respondió correctamente.')
    backup=ROOT/'.local/backups/pages-2026-10-17'; backup.mkdir(parents=True,exist_ok=True)
    index=backup/'index.html'
    if index.exists() and index.read_bytes()!=html: raise RuntimeError('La publicación cambió: preparar un nuevo respaldo versionado sin sobrescribir el anterior.')
    if not index.exists(): index.write_bytes(html)
    assets=re.findall(r'(?:src|href)="([^"]+)"',html.decode())
    report['pages_files']=[{'path':'index.html','sha256':hashlib.sha256(html).hexdigest()}]
    for asset in assets:
        address=urllib.parse.urljoin(PAGE,asset)
        parsed=urllib.parse.urlsplit(address)
        if parsed.scheme!='https' or parsed.netloc!='danielbmoreno.github.io' or not parsed.path.startswith('/PIPE/'):
            continue
        relative=parsed.path.removeprefix('/PIPE/')
        if not relative or '..' in Path(relative).parts: continue
        status,content=fetch(address)
        if status!=200: raise RuntimeError('No se pudo respaldar un recurso de la publicación.')
        destination=backup/relative; destination.parent.mkdir(parents=True,exist_ok=True)
        if destination.exists() and destination.read_bytes()!=content: raise RuntimeError('Un recurso publicado cambió: conservar el respaldo anterior y revisar la nueva versión.')
        if not destination.exists(): destination.write_bytes(content)
        report['pages_files'].append({'path':relative,'sha256':hashlib.sha256(content).hexdigest()})
    if '--build' in sys.argv:
        build_env=dict(os.environ,**{name:value for name,value in variables.items() if name in ['VITE_SUPABASE_URL','VITE_SUPABASE_ANON_KEY','VITE_SUPABASE_CREATE_STUDENT_FUNCTION']})
        args=['cmd.exe','/d','/c','npm.cmd','run','build'] if os.name=='nt' else ['npm','run','build']
        build=subprocess.run(args,cwd=ROOT/'frontend',env=build_env)
        report['configured_build_exit_code']=build.returncode
        if build.returncode: raise RuntimeError('La compilación con las variables verificadas falló.')
        scripts=list((ROOT/'frontend/dist/assets').glob('*.js'))
        report['configured_bundle_contains_project_url']=any(url in p.read_text(encoding='utf-8') for p in scripts)
        report['configured_bundle_contains_public_key']=any(key in p.read_text(encoding='utf-8') for p in scripts)
        if not report['configured_bundle_contains_project_url'] or not report['configured_bundle_contains_public_key']:
            raise RuntimeError('No se encontró la conexión pública esperada en el bundle compilado.')
    report['result']='PASSED_READ_ONLY'
except (RuntimeError,urllib.error.URLError,subprocess.TimeoutExpired,ValueError) as error:
    report['result']='FAILED'; report['reason']=str(error)
destination=ROOT/'.local/approval/remote-release-validation.json'
destination.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'result':report['result'],'auth_settings_http':report.get('auth_settings_http'),'anonymous_tables_checked':len(report.get('anonymous_checks',[])),'pages_http':report.get('pages_http'),'configured_build_exit_code':report.get('configured_build_exit_code'),'evidence':str(destination.relative_to(ROOT))}))
if report['result']=='FAILED': sys.exit(1)
