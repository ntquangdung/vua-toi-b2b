@echo off
cd /d "%~dp0"
echo Landing page: http://127.0.0.1:8765/
echo Keep this window open while using the consultation and order forms.
python -m http.server 8765 --bind 127.0.0.1
if errorlevel 1 pause
