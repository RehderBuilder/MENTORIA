$root = $PSScriptRoot
$ports = @(3000, 3001, 8080, 5500)

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.json' = 'application/json'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.svg'  = 'image/svg+xml'
  '.ico'  = 'image/x-icon'
}

$listener = New-Object System.Net.HttpListener
$activeUrl = $null

foreach ($port in $ports) {
  $candidate = "http://127.0.0.1:$port/"
  $listener.Prefixes.Clear()
  $listener.Prefixes.Add($candidate)
  try {
    $listener.Start()
    $activeUrl = $candidate
    break
  } catch {
    continue
  }
}

if (-not $activeUrl) {
  Write-Host ""
  Write-Host "  ERRO: Nenhuma porta disponivel (3000, 3001, 8080, 5500)."
  Write-Host "  Abrindo o site diretamente..."
  Write-Host ""
  Start-Process (Join-Path $root 'index.html')
  exit 1
}

Write-Host ""
Write-Host "  Mentoria Cursor - servidor ativo"
Write-Host "  Acesse: $activeUrl"
Write-Host ""
Write-Host "  Pressione Ctrl+C para encerrar."
Write-Host ""

Start-Process $activeUrl

while ($listener.IsListening) {
  $context = $listener.GetContext()
  $request = $context.Request
  $response = $context.Response

  $path = $request.Url.LocalPath
  if ($path -eq '/') { $path = '/index.html' }

  $relative = $path.TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar)
  $filePath = Join-Path $root $relative

  $rootFull = [IO.Path]::GetFullPath($root)
  $fileFull = [IO.Path]::GetFullPath($filePath)

  if (-not $fileFull.StartsWith($rootFull, [StringComparison]::OrdinalIgnoreCase)) {
    $response.StatusCode = 403
    $buffer = [Text.Encoding]::UTF8.GetBytes('Acesso negado')
    $response.OutputStream.Write($buffer, 0, $buffer.Length)
    $response.Close()
    continue
  }

  if (Test-Path $fileFull -PathType Leaf) {
    $ext = [IO.Path]::GetExtension($fileFull).ToLower()
    $contentType = $mime[$ext]
    if (-not $contentType) { $contentType = 'text/plain' }

    $bytes = [IO.File]::ReadAllBytes($fileFull)
    $response.StatusCode = 200
    $response.ContentType = $contentType
    $response.ContentLength64 = $bytes.Length
    $response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $response.StatusCode = 404
    $buffer = [Text.Encoding]::UTF8.GetBytes('Arquivo nao encontrado')
    $response.OutputStream.Write($buffer, 0, $buffer.Length)
  }

  $response.Close()
}
