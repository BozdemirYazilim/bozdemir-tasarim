<?php
ob_start();
require_once __DIR__ . '/_session.php';
ob_clean();
requireAuth();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(['ok' => false, 'error' => 'Method Not Allowed']); exit;
}
$data = json_decode(file_get_contents('php://input'), true);
if (!$data || empty($data['filename']) || empty($data['data'])) {
    http_response_code(400); echo json_encode(['ok' => false, 'error' => 'Eksik alan']); exit;
}
$filename    = basename($data['filename']);
$ext         = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
$allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'];
if (!in_array($ext, $allowedExts, true)) {
    http_response_code(400); echo json_encode(['ok' => false, 'error' => 'Izin verilmeyen tur']); exit;
}
$raw = $data['data'];
if (preg_match('/^data:[^;]+;base64,(.+)$/', $raw, $m)) $raw = $m[1];
$bytes = base64_decode($raw, true);
if ($bytes === false) {
    http_response_code(400); echo json_encode(['ok' => false, 'error' => 'Gecersiz base64']); exit;
}
if (strlen($bytes) > 3 * 1024 * 1024) {
    http_response_code(413); echo json_encode(['ok' => false, 'error' => 'Max 3 MB']); exit;
}
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime  = $finfo->buffer($bytes);
$allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
if (!in_array($mime, $allowedMimes, true)) {
    http_response_code(400); echo json_encode(['ok' => false, 'error' => 'Gecersiz MIME: ' . $mime]); exit;
}
$out = $bytes;
if (function_exists('imagecreatefromstring') && in_array($mime, ['image/jpeg','image/png','image/webp'])) {
    $img = @imagecreatefromstring($bytes);
    if ($img !== false) {
        $w = imagesx($img); $h = imagesy($img); $max = 1920;
        if ($w > $max || $h > $max) {
            $r = min($max / $w, $max / $h);
            $nw = (int)round($w * $r); $nh = (int)round($h * $r);
            $dst = imagecreatetruecolor($nw, $nh);
            if ($mime === 'image/png') {
                imagealphablending($dst, false); imagesavealpha($dst, true);
                imagefill($dst, 0, 0, imagecolorallocatealpha($dst, 0, 0, 0, 127));
            }
            imagecopyresampled($dst, $img, 0, 0, 0, 0, $nw, $nh, $w, $h);
            imagedestroy($img); $img = $dst;
        }
        ob_start();
        if ($mime === 'image/png') imagepng($img, null, 6);
        elseif ($mime === 'image/webp') imagewebp($img, null, 85);
        else { imagejpeg($img, null, 85); $ext = 'jpg'; $filename = pathinfo($filename, PATHINFO_FILENAME) . '.jpg'; }
        $buf = ob_get_clean();
        if ($buf) $out = $buf;
        imagedestroy($img);
    }
}
$uploadDir = __DIR__ . '/../images/projects/';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
$savePath = $uploadDir . $filename;
if (file_put_contents($savePath, $out, LOCK_EX) === false) {
    http_response_code(500); echo json_encode(['ok' => false, 'error' => 'Dosya kaydedilemedi']); exit;
}
echo json_encode(['ok' => true, 'path' => 'images/projects/' . $filename]);
