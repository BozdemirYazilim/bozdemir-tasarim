<?php
error_reporting(0);
ini_set('display_errors', 0);
ob_start();

$secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
session_set_cookie_params([
    'httponly' => true,
    'secure' => $secure,
    'samesite' => 'Strict',
    'path' => '/',
]);
session_start();

function requireAuth() {
    $loggedIn = isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
    $loginTime = (int)($_SESSION['login_time'] ?? 0);
    if (!$loggedIn || !$loginTime || (time() - $loginTime) > 7200) {
        $_SESSION = [];
        if (session_status() === PHP_SESSION_ACTIVE) session_destroy();
        ob_clean();
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    $_SESSION['login_time'] = time();
}
