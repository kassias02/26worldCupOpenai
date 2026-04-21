<?php
header('Content-Type: application/json; charset=utf-8');

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
$email = isset($data['email']) ? strtolower(trim($data['email'])) : '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Invalid email']);
  exit;
}

$storageFile = __DIR__ . '/emails.csv';
$line = sprintf("%s,%s\n", date('c'), $email);
file_put_contents($storageFile, $line, FILE_APPEND | LOCK_EX);

echo json_encode(['ok' => true]);
