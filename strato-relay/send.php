<?php
/**
 * E-Mail-Relay für Barbier Berlin
 * Läuft auf Strato Webspace, wird von Cloudflare Workers per HTTP aufgerufen.
 * Sendet E-Mails über Stratos SMTP (localhost / mail()).
 *
 * Deployment: Per FTP auf den Strato Webspace hochladen.
 * URL: https://barbier.berlin/api-relay/send.php
 */

// CORS + Auth
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://barbier-berlin.pages.dev');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Relay-Secret');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Secret prüfen (muss als Cloudflare Secret + hier identisch sein)
$RELAY_SECRET = getenv('RELAY_SECRET') ?: '0052fe244294d67b4c23f8cdd8b923a4a8bfdcd73440a81bd36abc1c227231b0';
$requestSecret = $_SERVER['HTTP_X_RELAY_SECRET'] ?? '';

if (!hash_equals($RELAY_SECRET, $requestSecret)) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Request Body lesen
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['to']) || empty($input['subject']) || empty($input['html'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing: to, subject, html']);
    exit;
}

$to = filter_var($input['to'], FILTER_VALIDATE_EMAIL);
if (!$to) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email address']);
    exit;
}

$subject = mb_encode_mimeheader($input['subject'], 'UTF-8');
$html = $input['html'];
$text = $input['text'] ?? strip_tags($html);
$from = 'Barbier Berlin <info@barbier.berlin>';

// MIME Multipart
$boundary = md5(time());
$headers = implode("\r\n", [
    "From: $from",
    "Reply-To: info@barbier.berlin",
    "MIME-Version: 1.0",
    "Content-Type: multipart/alternative; boundary=\"$boundary\"",
    "X-Mailer: BarbierBerlin-Relay/1.0",
]);

$body = implode("\r\n", [
    "--$boundary",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    chunk_split(base64_encode($text)),
    "--$boundary",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    chunk_split(base64_encode($html)),
    "--$boundary--",
]);

// Senden über PHP mail() (nutzt Stratos lokalen SMTP)
$success = mail($to, $subject, $body, $headers);

if ($success) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'mail() fehlgeschlagen']);
}
