import os
import sys
import PyInstaller.__main__
import argparse

def build_standalone_agent(org_id=None, server_url=None):
    """Build a standalone Windows agent executable"""
    print("Building standalone Windows agent...")
    
    # Create a temporary spec file with environment variables
    spec_content = f'''
# -*- mode: python ; coding: utf-8 -*-

env_vars = {{
    'TRACKM_ORG_ID': '{org_id or ""}',
    'TRACKM_SERVER_URL': '{server_url or "http://localhost:8000"}',
}}

a = Analysis(
    ['windows_agent.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=[
        'win32gui',
        'win32process',
        'win32api',
        'win32con',
        'psutil',
        'PIL',
        'requests',
        'keyboard',
        'mss'
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
    name='ActivTrack_Agent',
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
    icon='icon.ico',
    version='file_version_info.txt',
    uac_admin=True,
)
'''
    
    # Write the spec file
    with open('agent.spec', 'w') as f:
        f.write(spec_content)
    
    # Create version info file
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
        [StringStruct(u'CompanyName', u'ActivTrack'),
         StringStruct(u'FileDescription', u'ActivTrack Activity Monitoring Agent'),
         StringStruct(u'FileVersion', u'1.0.0.0'),
         StringStruct(u'InternalName', u'activtrack_agent'),
         StringStruct(u'LegalCopyright', u'Copyright (c) 2024 ActivTrack'),
         StringStruct(u'OriginalFilename', u'ActivTrack_Agent.exe'),
         StringStruct(u'ProductName', u'ActivTrack Agent'),
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
    
    print("\nBuild complete!")
    print("Executable location: dist/ActivTrack_Agent.exe")

def main():
    parser = argparse.ArgumentParser(description="Build standalone Windows agent")
    parser.add_argument('--org-id', help='Organization ID to embed in the agent')
    parser.add_argument('--server-url', help='Server URL for the agent to connect to')
    
    args = parser.parse_args()
    build_standalone_agent(args.org_id, args.server_url)

if __name__ == "__main__":
    main() 