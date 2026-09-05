"""Print TypeScript from Pydantic, or --check the committed contract in CI."""
import json
import sys
from pathlib import Path
import domain

def ts(schema):
    if schema is True:
        return 'unknown'
    if schema is False:
        return 'never'
    if '$ref' in schema:
        return schema['$ref'].split('/')[-1]
    if 'const' in schema:
        return json.dumps(schema['const'])
    if 'enum' in schema:
        return ' | '.join(json.dumps(v) for v in schema['enum'])
    if 'anyOf' in schema:
        return ' | '.join(ts(s) for s in schema['anyOf'])
    kind = schema.get('type')
    if kind == 'array':
        return f'Array<{ts(schema["items"])}>'
    if kind == 'object':
        if 'properties' in schema:
            return '{\n' + '\n'.join(f'  {name}: {ts(value)};' for name, value in schema['properties'].items()) + '\n}'
        return f'Record<{ts(schema.get("propertyNames", {"type": "string"}))}, {ts(schema.get("additionalProperties", {}))}>'
    return {'string': 'string', 'number': 'number', 'integer': 'number', 'boolean': 'boolean', 'null': 'null'}.get(kind, 'unknown')

def generate():
    lines = ['// Generated from backend/domain.py by export_types.py. Do not edit by hand.']
    for name, cls in vars(domain).items():
        if isinstance(cls, type) and issubclass(cls, domain.Model) and cls is not domain.Model:
            lines.append(f'export type {name} = {ts(cls.model_json_schema(by_alias=True))};')
    return '\n\n'.join(lines) + '\n'

if __name__ == '__main__':
    output = generate()
    if '--check' in sys.argv:
        target = Path(__file__).parents[1] / 'frontend/types/domain.ts'
        if not target.exists() or target.read_text(encoding='utf-8') != output:
            sys.exit('TypeScript contract is stale. Regenerate from backend/export_types.py.')
        print('Domain contract matches Pydantic.')
    else:
        print(output, end='')
