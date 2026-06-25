@echo off
title Mentoria Cursor - Servidor Local
cd /d "%~dp0"

echo.
echo  Iniciando servidor local...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0servidor.ps1"

if errorlevel 1 (
  echo.
  echo  Nao foi possivel iniciar o servidor.
  echo  Abrindo o site diretamente no navegador...
  echo.
  start "" "%~dp0index.html"
  pause
)
