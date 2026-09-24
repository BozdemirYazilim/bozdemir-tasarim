<?php
error_reporting(0);
ini_set('display_errors', 0);
ob_start();
session_start();

function requireAuth() {
    if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
        ob_clean();
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
}
