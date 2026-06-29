<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

const MAX_REQUEST_BYTES = 7_000_000;
const MAX_FILE_BYTES = 5_000_000;
const RATE_LIMIT_WINDOW = 600;
const RATE_LIMIT_MAX = 5;

$root = dirname(__DIR__);
$logDir = $root . '/logs';
$sessionDir = $root . '/sessions';
$quarantineDir = $root . '/quarantine';

foreach ([$logDir, $sessionDir, $quarantineDir] as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0750, true);
    }
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

function contains_text(string $value, string $needle): bool
{
    return $needle === '' || strpos($value, $needle) !== false;
}

function env_value(string $key, ?string $default = null): ?string
{
    static $loaded = false;

    if (!$loaded) {
        $envFile = dirname(__DIR__) . '/.env';
        if (is_readable($envFile)) {
            foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
                $line = trim($line);
                if ($line === '' || starts_with($line, '#') || !contains_text($line, '=')) {
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

function sanitize_field($value, int $max = 1200): string
{
    $value = is_string($value) ? $value : '';
    $value = strip_tags($value);
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
    $value = preg_replace('/\s+/u', ' ', $value) ?? '';
    return substr(trim($value), 0, $max);
}

function fail_with_log(int $status, string $message, array $context = []): void
{
    log_event('form_rejected', ['message' => $message] + $context);
    json_response($status, ['ok' => false, 'message' => $message]);
}

function first_present(array $fields, array $keys, string $default = 'Not provided'): string
{
    foreach ($keys as $key) {
        if (!empty($fields[$key])) {
            return $fields[$key];
        }
    }

    return $default;
}

function lead_department(string $formType, array $fields): string
{
    if (in_array($formType, ['Driver Application', 'Owner Operator Application'], true)) {
        return 'HR';
    }

    if ($formType === 'Contact Message') {
        $department = strtolower($fields['department'] ?? '');
        if (in_array($department, ['hr', 'recruiting', 'drivers'], true)) {
            return 'HR';
        }
        if ($department === 'admin') {
            return 'Admin';
        }
    }

    return 'Dispatch';
}

function build_telegram_summary(string $leadId, string $formType, string $department, array $fields, int $uploadCount): string
{
    $lines = [
        "🚛 NEW ENERGY LOGISTICS LEAD",
        "",
        "Type:",
        $formType,
        "",
        "Name:",
        first_present($fields, ['fullName', 'contactName']),
        "Company:",
        first_present($fields, ['companyName', 'brokerageName']),
        "Phone:",
        first_present($fields, ['phone']),
        "Email:",
        first_present($fields, ['email']),
        "Pickup:",
        first_present($fields, ['pickupLocation']),
        "Delivery:",
        first_present($fields, ['deliveryLocation']),
        "Commodity:",
        first_present($fields, ['commodity', 'freightType', 'requestType', 'driverType']),
        "Notes:",
        first_present($fields, ['notes', 'message', 'loadDetails']),
        "",
        "Department:",
        $department,
        "",
        "Lead ID:",
        $leadId,
        "Secure uploads received:",
        (string)$uploadCount,
        "",
        "Private uploaded documents are not attached to Telegram.",
    ];

    return implode("\n", $lines);
}

function send_telegram_notification(string $message): array
{
    $telegramToken = env_value('TELEGRAM_BOT_TOKEN');
    $telegramChat = env_value('TELEGRAM_CHAT_ID');

    if (!$telegramToken || !$telegramChat) {
        log_event('telegram_skipped', ['reason' => 'missing_credentials']);
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
    $sent = is_string($response) && strpos($statusLine, '200') !== false;
    if (!$sent) {
        log_event('telegram_failed', [
            'status' => $statusLine ?: 'no_response',
            'response' => substr(is_string($response) ? $response : '', 0, 500),
        ]);
    }

    return ['configured' => true, 'sent' => $sent, 'status' => $statusLine ?: null];
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, ['ok' => false, 'message' => 'Method not allowed']);
}

if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > MAX_REQUEST_BYTES) {
    fail_with_log(413, 'Request is too large');
}

$appUrl = env_value('APP_URL', '');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$referer = $_SERVER['HTTP_REFERER'] ?? '';
if ($appUrl && $origin && !starts_with($origin, $appUrl)) {
    fail_with_log(403, 'Invalid origin', ['origin' => $origin]);
}
if ($appUrl && !$origin && $referer && !starts_with($referer, $appUrl)) {
    fail_with_log(403, 'Invalid referrer', ['referer' => $referer]);
}

$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = dirname(__DIR__) . '/sessions/form-rate-' . hash('sha256', $ip) . '.json';
$now = time();
$timestamps = is_readable($rateFile) ? json_decode((string)file_get_contents($rateFile), true) : [];
$timestamps = is_array($timestamps) ? array_values(array_filter($timestamps, fn ($ts) => is_int($ts) && $now - $ts < RATE_LIMIT_WINDOW)) : [];
if (count($timestamps) >= RATE_LIMIT_MAX) {
    fail_with_log(429, 'Too many submissions');
}
$timestamps[] = $now;
file_put_contents($rateFile, json_encode($timestamps), LOCK_EX);

if (sanitize_field($_POST['website'] ?? '') !== '') {
    log_event('honeypot_triggered', []);
    json_response(200, ['ok' => true]);
}

$turnstileSecret = env_value('TURNSTILE_SECRET_KEY');
if ($turnstileSecret) {
    $token = sanitize_field($_POST['cf-turnstile-response'] ?? '', 2048);
    $verify = file_get_contents('https://challenges.cloudflare.com/turnstile/v0/siteverify', false, stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => http_build_query([
                'secret' => $turnstileSecret,
                'response' => $token,
                'remoteip' => $ip,
            ]),
            'timeout' => 4,
        ],
    ]));
    $verified = $verify ? json_decode($verify, true) : null;
    if (!is_array($verified) || empty($verified['success'])) {
        fail_with_log(403, 'CAPTCHA verification failed');
    }
}

$payload = json_decode((string)($_POST['payload'] ?? '{}'), true);
$fields = is_array($payload['fields'] ?? null) ? $payload['fields'] : $_POST;
$allowedTypes = [
    'Broker Verification / Carrier Packet Request',
    'Broker Freight Request',
    'Freight Quote',
    'Broker Request',
    'Driver Application',
    'Owner Operator Application',
    'Contact Message',
];
$formType = sanitize_field($fields['formType'] ?? '', 120);
if (!in_array($formType, $allowedTypes, true)) {
    fail_with_log(422, 'Invalid form type');
}

$clean = [];
foreach ($fields as $key => $value) {
    $key = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)$key);
    if ($key === '' || in_array($key, ['website', 'payload', 'cf-turnstile-response'], true)) {
        continue;
    }
    $clean[$key] = sanitize_field($value, in_array($key, ['message', 'notes', 'loadDetails', 'brokerPacketLink'], true) ? 1200 : 160);
}

foreach (['email', 'phone'] as $required) {
    if (empty($clean[$required])) {
        fail_with_log(422, 'Required contact field is missing', ['field' => $required]);
    }
}
if (!filter_var($clean['email'], FILTER_VALIDATE_EMAIL)) {
    fail_with_log(422, 'Invalid email address');
}
if (!preg_match('/^[0-9+().\-\s]{7,32}$/', $clean['phone'])) {
    fail_with_log(422, 'Invalid phone number');
}

$allowedUploads = [
    'pdf' => 'application/pdf',
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png' => 'image/png',
    'doc' => 'application/msword',
    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
$blockedExtensions = ['exe', 'js', 'php', 'sh', 'bat', 'zip', 'cmd', 'com', 'msi', 'ps1'];
$quarantinedFiles = [];

foreach ($_FILES as $file) {
    $files = is_array($file['name']) ? array_keys($file['name']) : [null];
    foreach ($files as $index) {
        $name = $index === null ? $file['name'] : $file['name'][$index];
        $tmp = $index === null ? $file['tmp_name'] : $file['tmp_name'][$index];
        $size = $index === null ? $file['size'] : $file['size'][$index];
        $error = $index === null ? $file['error'] : $file['error'][$index];

        if ($error === UPLOAD_ERR_NO_FILE) {
            continue;
        }
        if ($error !== UPLOAD_ERR_OK || $size > MAX_FILE_BYTES) {
            fail_with_log(422, 'Invalid file upload', ['file' => $name]);
        }

        $extension = strtolower(pathinfo((string)$name, PATHINFO_EXTENSION));
        if (in_array($extension, $blockedExtensions, true) || !isset($allowedUploads[$extension])) {
            fail_with_log(422, 'File type is not allowed', ['file' => $name]);
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($tmp);
        if ($mime !== $allowedUploads[$extension]) {
            fail_with_log(422, 'File content type is not allowed', ['file' => $name, 'mime' => $mime]);
        }

        $safeName = bin2hex(random_bytes(16)) . '.' . $extension;
        $destination = dirname(__DIR__) . '/quarantine/' . $safeName;
        if (!move_uploaded_file($tmp, $destination)) {
            fail_with_log(500, 'Could not quarantine uploaded file');
        }
        chmod($destination, 0640);
        $quarantinedFiles[] = [
            'originalName' => sanitize_field($name, 180),
            'quarantineName' => $safeName,
            'size' => $size,
            'mime' => $mime,
        ];
    }
}

$leadId = bin2hex(random_bytes(8));
$department = lead_department($formType, $clean);
$record = [
    'id' => $leadId,
    'at' => gmdate('c'),
    'ipHash' => hash('sha256', $ip),
    'formType' => $formType,
    'department' => $department,
    'destination' => sanitize_field($_POST['destination'] ?? ''),
    'fields' => $clean,
    'quarantinedFiles' => $quarantinedFiles,
];
file_put_contents(dirname(__DIR__) . '/logs/leads.jsonl', json_encode($record, JSON_UNESCAPED_SLASHES) . PHP_EOL, FILE_APPEND | LOCK_EX);

$summary = build_telegram_summary($leadId, $formType, $department, $clean, count($quarantinedFiles));
$telegramResult = send_telegram_notification($summary);

$to = $department === 'HR' ? env_value('HR_EMAIL') : env_value('DISPATCH_EMAIL');
$from = env_value('EMAIL_FROM');
if ($to && $from) {
    @mail($to, 'New Energy Logistics website lead', $summary, [
        'From' => $from,
        'Reply-To' => $clean['email'],
        'X-Lead-ID' => $leadId,
    ]);
} else {
    log_event('email_skipped', ['leadId' => $leadId, 'reason' => 'missing_from_or_to', 'department' => $department]);
}

log_event('form_accepted', [
    'leadId' => $leadId,
    'formType' => $formType,
    'department' => $department,
    'uploads' => count($quarantinedFiles),
    'telegram' => $telegramResult,
]);
json_response(200, [
    'ok' => true,
    'id' => $leadId,
    'notifications' => [
        'telegramConfigured' => $telegramResult['configured'],
        'telegramSent' => $telegramResult['sent'],
    ],
]);
