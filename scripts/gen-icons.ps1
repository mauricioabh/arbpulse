# One-off ArbPulse PWA icon generator.
# Resizes the AI-generated master icon into the sizes referenced by the
# Web App Manifest and index.html. Uses only Windows System.Drawing (no deps).
param(
  [string]$Master = (Join-Path $PSScriptRoot "arbpulse-icon-master.png"),
  [string]$OutDir = (Join-Path $PSScriptRoot "..\web\public")
)

Add-Type -AssemblyName System.Drawing

$bg = [System.Drawing.ColorTranslator]::FromHtml("#0a0e14")

function Save-Resized {
  param([System.Drawing.Image]$Src, [int]$Size, [string]$Path, [double]$Scale = 1.0)

  $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear($bg)

  $target = [int]([math]::Round($Size * $Scale))
  $offset = [int]([math]::Round(($Size - $target) / 2))
  $rect = New-Object System.Drawing.Rectangle($offset, $offset, $target, $target)
  $g.DrawImage($Src, $rect)

  $g.Dispose()
  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output "wrote $Path ($Size x $Size, scale $Scale)"
}

$src = [System.Drawing.Image]::FromFile($Master)

Save-Resized -Src $src -Size 192 -Path (Join-Path $OutDir "icon-192.png")
Save-Resized -Src $src -Size 512 -Path (Join-Path $OutDir "icon-512.png")
Save-Resized -Src $src -Size 180 -Path (Join-Path $OutDir "apple-touch-icon.png")
# Maskable: full-bleed on the master's own background. The glyph's built-in
# padding already keeps it inside the ~80% safe zone, and full-bleed avoids a
# visible seam from mismatched flat padding vs. the master's subtle glow.
Save-Resized -Src $src -Size 512 -Path (Join-Path $OutDir "icon-maskable-512.png") -Scale 1.0

$src.Dispose()
