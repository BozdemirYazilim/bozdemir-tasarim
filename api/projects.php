<?php
ob_start();
require_once __DIR__ . '/_session.php';
ob_clean();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
$filePath = __DIR__ . '/../data/projects.json';
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!file_exists($filePath)) { echo json_encode(['projects' => []]); exit; }
    echo file_get_contents($filePath);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(['ok' => false, 'error' => 'Method Not Allowed']); exit;
}
requireAuth();
$data = json_decode(file_get_contents('php://input'), true);
if ($data === null) { http_response_code(400); echo json_encode(['ok' => false, 'error' => 'Gecersiz JSON']); exit; }
if (!is_dir(dirname($filePath))) { mkdir(dirname($filePath), 0755, true); }
$result = file_put_contents($filePath, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
if ($result === false) { http_response_code(500); echo json_encode(['ok' => false, 'error' => 'Dosya yazilamadi']); exit; }
echo json_encode(['ok' => true]);
