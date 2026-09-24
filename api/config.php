<?php
ob_start();
require_once __DIR__ . '/_session.php';
ob_clean();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
$filePath = __DIR__ . '/../data/config.json';
$contactPath = __DIR__ . '/../data/contact.json';
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!file_exists($filePath)) { echo json_encode(['contact' => []]); exit; }
    $cfg = json_decode(file_get_contents($filePath), true) ?: [];
    echo json_encode(['contact' => isset($cfg['contact']) ? $cfg['contact'] : []]);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(['ok' => false, 'error' => 'Method Not Allowed']); exit;
}
requireAuth();
$data = json_decode(file_get_contents('php://input'), true);
if ($data === null) { http_response_code(400); echo json_encode(['ok' => false, 'error' => 'Gecersiz JSON']); exit; }
if (!is_dir(dirname($filePath))) { mkdir(dirname($filePath), 0755, true); }
$existing = file_exists($filePath) ? (json_decode(file_get_contents($filePath), true) ?: []) : [];
if (isset($data['contact'])) {
    $existing['contact'] = $data['contact'];
} else {
    $existing = array_merge($existing, $data);
}
$result = file_put_contents($filePath, json_encode($existing, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
if ($result === false) { http_response_code(500); echo json_encode(['ok' => false, 'error' => 'Dosya yazilamadi']); exit; }
$contactData = isset($existing['contact']) ? $existing['contact'] : [];
file_put_contents($contactPath, json_encode($contactData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
echo json_encode(['ok' => true]);

