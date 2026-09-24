<?php
ob_start();
require_once __DIR__ . '/_session.php';
ob_clean();
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method Not Allowed']);
    exit;
}
$data = json_decode(file_get_contents('php://input'), true) ?: [];
$password = (string)($data['password'] ?? '');
if ($password === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Şifre gerekli']);
    exit;
}
$authFile = __DIR__ . '/../data/auth.local.json';
if (!is_file($authFile)) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'Yönetici hesabı yapılandırılmamış']);
    exit;
}
$auth = json_decode(file_get_contents($authFile), true) ?: [];
$storedHash = (string)($auth['passwordHash'] ?? '');
if ($storedHash !== '' && password_verify($password, $storedHash)) {
    session_regenerate_id(true);
    $_SESSION['admin_logged_in'] = true;
    $_SESSION['login_time'] = time();
    echo json_encode(['ok' => true]);
    exit;
}
http_response_code(401);
echo json_encode(['ok' => false, 'error' => 'Hatalı şifre']);
