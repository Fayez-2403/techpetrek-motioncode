"""Drive paperpilot-mcp.exe over stdio JSON-RPC: initialize, tools/list, then the calls given as JSON on argv.
Writes a transcript (every request and response) to transcript.json in the work dir."""
import json, subprocess, sys, os, time

exe, work = sys.argv[1], sys.argv[2]
calls = json.loads(sys.argv[3]) if len(sys.argv) > 3 else []
p = subprocess.Popen([exe], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=work, text=True, encoding='utf-8')
log, nid = [], [0]


def rpc(method, params=None, notify=False):
    msg = {'jsonrpc': '2.0', 'method': method}
    if params is not None:
        msg['params'] = params
    if not notify:
        nid[0] += 1; msg['id'] = nid[0]
    p.stdin.write(json.dumps(msg) + '\n'); p.stdin.flush()
    if notify:
        log.append({'req': msg}); return None
    t0 = time.time()
    while True:
        line = p.stdout.readline()
        if not line:
            raise SystemExit('server closed: ' + p.stderr.read()[-2000:])
        try:
            r = json.loads(line)
        except ValueError:
            continue
        if r.get('id') == msg['id']:
            log.append({'req': msg, 'res': r, 'ms': round((time.time() - t0) * 1000)}); return r


init = rpc('initialize', {'protocolVersion': '2025-06-18', 'capabilities': {}, 'clientInfo': {'name': 'techpetrek-test', 'version': '0'}})
print('server:', init.get('result', {}).get('serverInfo'))
rpc('notifications/initialized', notify=True)
tools = rpc('tools/list')['result']['tools']
print('tools:', len(tools))
want = {c['name'] for c in calls} | {'pdf_merge', 'pdf_compress', 'pdf_ocr', 'pdf_split'}
for t in tools:
    if t['name'] in want:
        print('--', t['name'], ':', t.get('description', '')[:160])
        print('   schema:', json.dumps(t.get('inputSchema', {}).get('properties', {}))[:600])
for c in calls:
    r = rpc('tools/call', {'name': c['name'], 'arguments': c['args']})
    print('CALL', c['name'], '->', json.dumps(r.get('result', r.get('error')))[:700])
json.dump({'tools': [t['name'] for t in tools], 'log': log}, open(os.path.join(work, 'transcript.json'), 'w'), indent=1)
p.stdin.close(); p.terminate()
