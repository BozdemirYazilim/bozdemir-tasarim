<?php
ob_start();
require_once __DIR__ . '/_session.php';
ob_clean();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method Not Allowed']);
    exit;
}
$data = json_decode(file_get_contents('php://input'), true);
$password = isset($data['password']) ? $data['password'] : '';
if (empty($password)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Sifre gerekli']);
    exit;
}
$configFile = __DIR__ . '/../data/config.json';
if (!file_exists($configFile)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Config bulunamadi']);
    exit;
}
$config = json_decode(file_get_contents($configFile), true);
$storedHash = isset($config['passwordHash']) ? $config['passwordHash'] : '';
if (hash('sha256', $password) === $storedHash) {
    $_SESSION['admin_logged_in'] = true;
    $_SESSION['login_time'] = time();
    echo json_encode(['ok' => true]);
} else {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Hatali sifre']);
}
