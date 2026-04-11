<?php
/**
 * E-Mail-Relay für Barbier Berlin
 * Sendet über Strato SMTP (mit DKIM/SPF/DMARC) statt mail().
 *
 * Deployment: Per FTP nach barbier.berlin/api-relay/send.php
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://barbier-berlin.pages.dev');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Relay-Secret');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); die(json_encode(['error' => 'Method not allowed'])); }

// Auth
$RELAY_SECRET = '0052fe244294d67b4c23f8cdd8b923a4a8bfdcd73440a81bd36abc1c227231b0';
if (!hash_equals($RELAY_SECRET, $_SERVER['HTTP_X_RELAY_SECRET'] ?? '')) {
    http_response_code(401); die(json_encode(['error' => 'Unauthorized']));
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || empty($input['to']) || empty($input['subject']) || empty($input['html'])) {
    http_response_code(400); die(json_encode(['error' => 'Missing: to, subject, html']));
}

$to = filter_var($input['to'], FILTER_VALIDATE_EMAIL);
if (!$to) { http_response_code(400); die(json_encode(['error' => 'Invalid email'])); }

// --- SMTP-Versand über Strato (mit DKIM) ---
$smtpHost = 'smtp.strato.de';
$smtpPort = 465;
$smtpUser = 'info@barbier.berlin';
$smtpPass = 'Mailbar123#';
$fromName = 'Barbier Berlin';
$fromEmail = 'info@barbier.berlin';

$subject = $input['subject'];
$html = $input['html'];
$text = $input['text'] ?? strip_tags($html);

// MIME Message
$boundary = md5(uniqid());
$message = "--$boundary\r\n"
    . "Content-Type: text/plain; charset=UTF-8\r\n"
    . "Content-Transfer-Encoding: base64\r\n\r\n"
    . chunk_split(base64_encode($text))
    . "--$boundary\r\n"
    . "Content-Type: text/html; charset=UTF-8\r\n"
    . "Content-Transfer-Encoding: base64\r\n\r\n"
    . chunk_split(base64_encode($html))
    . "--$boundary--";

// SMTP Connection via fsockopen (SSL)
$errno = 0; $errstr = '';
$smtp = @fsockopen("ssl://$smtpHost", $smtpPort, $errno, $errstr, 10);
if (!$smtp) {
    http_response_code(500);
    die(json_encode(['error' => "SMTP Verbindung fehlgeschlagen: $errstr"]));
}

function smtpRead($smtp) {
    $response = '';
    while ($line = fgets($smtp, 512)) {
        $response .= $line;
        if (substr($line, 3, 1) === ' ') break;
    }
    return $response;
}

function smtpSend($smtp, $cmd) {
    fwrite($smtp, $cmd . "\r\n");
    return smtpRead($smtp);
}

$greeting = smtpRead($smtp);
if (substr($greeting, 0, 3) !== '220') {
    fclose($smtp);
    http_response_code(500);
    die(json_encode(['error' => 'SMTP greeting failed']));
}

$ehlo = smtpSend($smtp, "EHLO barbier.berlin");
$auth = smtpSend($smtp, "AUTH LOGIN");
$user = smtpSend($smtp, base64_encode($smtpUser));
$pass = smtpSend($smtp, base64_encode($smtpPass));

if (substr($pass, 0, 3) !== '235') {
    fclose($smtp);
    http_response_code(500);
    die(json_encode(['error' => 'SMTP auth failed']));
}

smtpSend($smtp, "MAIL FROM:<$fromEmail>");
smtpSend($smtp, "RCPT TO:<$to>");
smtpSend($smtp, "DATA");

// Headers + Body
$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$data = "From: $fromName <$fromEmail>\r\n"
    . "To: $to\r\n"
    . "Subject: $encodedSubject\r\n"
    . "MIME-Version: 1.0\r\n"
    . "Content-Type: multipart/alternative; boundary=\"$boundary\"\r\n"
    . "Date: " . date('r') . "\r\n"
    . "Message-ID: <" . uniqid() . "@barbier.berlin>\r\n"
    . "\r\n"
    . $message;

$sendResult = smtpSend($smtp, $data . "\r\n.");

smtpSend($smtp, "QUIT");
fclose($smtp);

if (substr($sendResult, 0, 3) === '250') {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Send failed: ' . trim($sendResult)]);
}
