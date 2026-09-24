<?php
require_once __DIR__ . '/_session.php';
requireAuth();
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(['ok' => false, 'error' => 'Method Not Allowed']); exit;
}
$data = json_decode(file_get_contents('php://input'), true);
$currentPw = isset($data['currentPassword']) ? $data['currentPassword'] : '';
$newPw     = isset($data['newPassword'])     ? $data['newPassword']     : '';
if (empty($currentPw) || empty($newPw)) {
    http_response_code(400); echo json_encode(['ok' => false, 'error' => 'Eksik alan']); exit;
}
$configFile = __DIR__ . '/../data/config.json';
$config = json_decode(file_get_contents($configFile), true);
$stored = isset($config['passwordHash']) ? $config['passwordHash'] : '';
if (hash('sha256', $currentPw) !== $stored) {
    http_response_code(401); echo json_encode(['ok' => false, 'error' => 'Mevcut sifre hatali']); exit;
}
$config['passwordHash'] = hash('sha256', $newPw);
file_put_contents($configFile, json_encode($config, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
echo json_encode(['ok' => true]);
