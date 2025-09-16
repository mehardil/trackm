import os
import sys
import PyInstaller.__main__
import argparse
import json
import shutil

def build_standalone_agent(org_id=None, server_url=None, org_name=None, org_identifier=None, agent_settings=None):
    """Build a standalone Windows agent executable with organization-specific configuration"""
    print(f"Building standalone Windows agent for organization: {org_name or 'Default'}")
    
    # Get organization-specific settings
    org_id = org_id or os.getenv('TRACKM_ORG_ID', '')
    org_name = org_name or os.getenv('TRACKM_ORGANIZATION_NAME', 'ActivTrack')
    org_identifier = org_identifier or os.getenv('TRACKM_ORG_IDENTIFIER', 'DEFAULT')
    server_url = server_url or os.getenv('TRACKM_SERVER_URL', 'http://localhost:8000')
    
    # Parse agent settings
    if agent_settings:
        if isinstance(agent_settings, str):
            agent_settings = json.loads(agent_settings)
    else:
        agent_settings_str = os.getenv('TRACKM_AGENT_SETTINGS', '{}')
        agent_settings = json.loads(agent_settings_str) if agent_settings_str else {}
    
    # Create organization-specific config file
    config_data = {
        'organization_id': int(org_id) if org_id else None,
        'organization_name': org_name,
        'org_identifier': org_identifier,
        'api_endpoint': f"{server_url}/api",
        'ws_endpoint': f"{server_url.replace('http', 'ws')}/ws",
        'screenshot_enabled': agent_settings.get('activity_tracking', True),
        'activity_tracking_enabled': agent_settings.get('activity_tracking', True),
        'idle_threshold': agent_settings.get('idle_threshold', 300),
        'restricted_apps': agent_settings.get('restricted_apps', []),
        'custom_branding': agent_settings.get('custom_branding', {
            'organization_name': org_name,
            'primary_color': '#4CAF50',
            'logo_url': ''
        })
    }
    
    # Write organization-specific config
    config_file = f"config_org_{org_id}.json" if org_id else "config_default.json"
    with open(config_file, 'w') as f:
        json.dump(config_data, f, indent=2)
    
    # Create a temporary spec file with environment variables
    spec_content = f'''
# -*- mode: python ; coding: utf-8 -*-

env_vars = {{
    'TRACKM_ORG_ID': '{org_id or ""}',
    'TRACKM_ORGANIZATION_NAME': '{org_name}',
    'TRACKM_ORG_IDENTIFIER': '{org_identifier}',
    'TRACKM_SERVER_URL': '{server_url}',
    'TRACKM_AGENT_SETTINGS': '{json.dumps(agent_settings)}',
}}

a = Analysis(
    ['windows_agent.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('{config_file}', '.'),
        ('config.json.template', '.'),
    ],
    hiddenimports=[
        'win32gui',
        'win32process',
        'win32api',
        'win32con',
        'psutil',
        'PIL',
        'requests',
        'keyboard',
        'mss',
        'websocket',
        'websocket-client'
    ],
    hookspath=[],
    hooksconfig={{}},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=None,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=None)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='ActivTrack_{org_name.replace(" ", "_")}_Agent' if '{org_name}' != 'ActivTrack' else 'ActivTrack_Agent',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='icon.ico' if os.path.exists('icon.ico') else None,
    version='file_version_info.txt',
    uac_admin=True,
)
'''
    
    # Write the spec file
    with open('agent.spec', 'w') as f:
        f.write(spec_content)
    
    # Create version info file with organization branding
    version_info = f'''
VSVersionInfo(
  ffi=FixedFileInfo(
    filevers=(1, 0, 0, 0),
    prodvers=(1, 0, 0, 0),
    mask=0x3f,
    flags=0x0,
    OS=0x40004,
    fileType=0x1,
    subtype=0x0,
    date=(0, 0)
  ),
  kids=[
    StringFileInfo([
      StringTable(
        u'040904B0',
        [StringStruct(u'CompanyName', u'{org_name}'),
         StringStruct(u'FileDescription', u'{org_name} Activity Monitoring Agent'),
         StringStruct(u'FileVersion', u'1.0.0.0'),
         StringStruct(u'InternalName', u'activtrack_agent'),
         StringStruct(u'LegalCopyright', u'Copyright (c) 2024 {org_name}'),
         StringStruct(u'OriginalFilename', u'ActivTrack_{org_name.replace(" ", "_")}_Agent.exe'),
         StringStruct(u'ProductName', u'{org_name} Agent'),
         StringStruct(u'ProductVersion', u'1.0.0.0')])
    ]),
    VarFileInfo([VarStruct(u'Translation', [1033, 1200])])
  ]
)
'''
    
    with open('file_version_info.txt', 'w') as f:
        f.write(version_info)
    
    # Build the executable using PyInstaller
    PyInstaller.__main__.run([
        'agent.spec',
        '--clean',
        '--onefile'
    ])
    
    # Clean up temporary files
    if os.path.exists(config_file):
        os.remove(config_file)
    if os.path.exists('agent.spec'):
        os.remove('agent.spec')
    if os.path.exists('file_version_info.txt'):
        os.remove('file_version_info.txt')
    
    # Determine output filename
    output_name = f'ActivTrack_{org_name.replace(" ", "_")}_Agent.exe' if org_name != 'ActivTrack' else 'ActivTrack_Agent.exe'
    output_path = f'dist/{output_name}'
    
    print(f"\nBuild complete!")
    print(f"Executable location: {output_path}")
    print(f"Organization: {org_name}")
    print(f"Organization ID: {org_id}")
    print(f"Server URL: {server_url}")
    
    return output_path

def main():
    parser = argparse.ArgumentParser(description="Build standalone Windows agent")
    parser.add_argument('--org-id', help='Organization ID to embed in the agent')
    parser.add_argument('--server-url', help='Server URL for the agent to connect to')
    parser.add_argument('--org-name', help='Organization name for branding')
    parser.add_argument('--org-identifier', help='Organization identifier')
    parser.add_argument('--agent-settings', help='JSON string of agent settings')
    
    args = parser.parse_args()
    
    # Parse agent settings if provided
    agent_settings = None
    if args.agent_settings:
        try:
            agent_settings = json.loads(args.agent_settings)
        except json.JSONDecodeError:
            print("Error: Invalid JSON in agent-settings")
            sys.exit(1)
    
    build_standalone_agent(
        org_id=args.org_id,
        server_url=args.server_url,
        org_name=args.org_name,
        org_identifier=args.org_identifier,
        agent_settings=agent_settings
    )

if __name__ == "__main__":
    main() 