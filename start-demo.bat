@echo off
setlocal

set NGROK=C:\Users\Nitro\AppData\Local\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe

echo ============================================
echo  Starting HMS for demo
echo ============================================
echo.

echo [1/3] Starting Docker containers...
cd /d E:\HM1\HMS
docker compose up -d

echo.
echo [2/3] Waiting for the app to come up...
ping -n 9 127.0.0.1 >nul

echo.
echo [3/3] Starting ngrok tunnel...
start "ngrok tunnel - do not close during demo" "%NGROK%" http 80

echo Waiting for the tunnel to establish...
ping -n 7 127.0.0.1 >nul

echo.
echo ============================================
echo  YOUR DEMO LINK:
echo ============================================
powershell -NoProfile -Command "$u=$null; for($i=0;$i-lt 6 -and -not $u;$i++){ try { $u=(Invoke-RestMethod http://127.0.0.1:4040/api/tunnels).tunnels[0].public_url } catch { Start-Sleep -Seconds 2 } }; if($u){$u}else{'Tunnel still starting - rerun this script, or check http://127.0.0.1:4040'}"
echo ============================================
echo.
echo Keep this window and the ngrok window OPEN during your demo.
echo Closing either one will break the link.
echo.
pause
