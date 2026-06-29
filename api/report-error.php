<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

const MAX_ERROR_BYTES = 20_000;

$root = dirname(__DIR__);
$logDir = $root . '/logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0750, true);
}

function json_response(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function starts_with(string $value, string $prefix): bool
{
    return substr($value, 0, strlen($prefix)) === $prefix;
}

function env_value(string $key, ?string $default = null): ?string
{
    static $loaded = false;

    if (!$loaded) {
        $envFile = dirname(__DIR__) . '/.env';
        if (is_readable($envFile)) {
            foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
                $line = trim($line);
                if ($line === '' || starts_with($line, '#') || strpos($line, '=') === false) {
                    continue;
                }
                [$name, $value] = array_map('trim', explode('=', $line, 2));
                if (getenv($name) === false) {
                    putenv($name . '=' . trim($value, "\"'"));
                }
            }
        }
        $loaded = true;
    }

    $value = getenv($key);
    return $value === false || $value === '' ? $default : $value;
}

function sanitize_field($value, int $max = 500): string
{
    $value = is_string($value) ? $value : '';
    $value = strip_tags($value);
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
    $value = preg_replace('/\s+/u', ' ', $value) ?? '';
    return substr(trim($value), 0, $max);
}

function log_event(string $type, array $context): void
{
    $line = json_encode([
        'type' => $type,
        'at' => gmdate('c'),
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'context' => $context,
    ], JSON_UNESCAPED_SLASHES);

    file_put_contents(dirname(__DIR__) . '/logs/security.log', $line . PHP_EOL, FILE_APPEND | LOCK_EX);
}

function send_telegram_message(string $message): array
{
    $telegramToken = env_value('TELEGRAM_BOT_TOKEN');
    $telegramChat = env_value('TELEGRAM_CHAT_ID');

    if (!$telegramToken || !$telegramChat) {
        return ['configured' => false, 'sent' => false, 'reason' => 'missing_credentials'];
    }

    $telegramUrl = 'https://api.telegram.org/bot' . rawurlencode($telegramToken) . '/sendMessage';
    $response = @file_get_contents($telegramUrl, false, stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => http_build_query([
                'chat_id' => $telegramChat,
                'text' => $message,
                'disable_web_page_preview' => 'true',
            ]),
            'ignore_errors' => true,
            'timeout' => 4,
        ],
    ]));

    $statusLine = $http_response_header[0] ?? '';
    return [
        'configured' => true,
        'sent' => is_string($response) && strpos($statusLine, '200') !== false,
        'status' => $statusLine ?: null,
    ];
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, ['ok' => false, 'message' => 'Method not allowed']);
}

if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > MAX_ERROR_BYTES) {
    json_response(413, ['ok' => false, 'message' => 'Request is too large']);
}

$appUrl = env_value('APP_URL', '');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$referer = $_SERVER['HTTP_REFERER'] ?? '';
if ($appUrl && $origin && !starts_with($origin, $appUrl)) {
    json_response(403, ['ok' => false, 'message' => 'Invalid origin']);
}
if ($appUrl && !$origin && $referer && !starts_with($referer, $appUrl)) {
    json_response(403, ['ok' => false, 'message' => 'Invalid referrer']);
}

$payload = json_decode((string)file_get_contents('php://input'), true);
$payload = is_array($payload) ? $payload : [];

$errorId = bin2hex(random_bytes(8));
$error = [
    'id' => $errorId,
    'message' => sanitize_field($payload['message'] ?? 'Unknown website error'),
    'source' => sanitize_field($payload['source'] ?? ''),
    'line' => sanitize_field((string)($payload['line'] ?? ''), 40),
    'column' => sanitize_field((string)($payload['column'] ?? ''), 40),
    'path' => sanitize_field($payload['path'] ?? ''),
    'userAgent' => sanitize_field($_SERVER['HTTP_USER_AGENT'] ?? '', 300),
];

log_event('website_error', $error);

$telegram = send_telegram_message(implode("\n", [
    "⚠️ ENERGY LOGISTICS WEBSITE ERROR",
    "",
    "Message:",
    $error['message'],
    "Source:",
    $error['source'] ?: 'Not provided',
    "Path:",
    $error['path'] ?: 'Not provided',
    "Error ID:",
    $errorId,
]));

if (!$telegram['sent']) {
    log_event('telegram_error_alert_not_sent', ['errorId' => $errorId, 'telegram' => $telegram]);
}

json_response(200, ['ok' => true, 'id' => $errorId]);
