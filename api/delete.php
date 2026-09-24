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
if (!$data || empty($data['images'])) { echo json_encode(['ok' => true, 'deleted' => 0]); exit; }
$deleted = 0; $errors = [];
$baseDir = realpath(__DIR__ . '/..');
$imagesDir = realpath(__DIR__ . '/../images');
foreach ($data['images'] as $imgPath) {
    $imgPath = ltrim($imgPath, '/');
    if (strpos($imgPath, '..') !== false) continue;
    if (strpos($imgPath, 'images/') !== 0) continue;
    $full = realpath($baseDir . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $imgPath));
    if ($full === false || $imagesDir === false) continue;
    if (strpos($full, $imagesDir) !== 0) continue;
    if (file_exists($full)) { if (unlink($full)) $deleted++; else $errors[] = $imgPath; }
}
echo json_encode(['ok' => true, 'deleted' => $deleted, 'errors' => $errors]);
