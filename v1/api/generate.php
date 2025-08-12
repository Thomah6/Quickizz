<?php
header('Content-Type: application/json');

// Charger la clé API Groq depuis .env si présent
function loadEnvGroqKey() {
    $envPath ='.env';
    if (file_exists($envPath)) {
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), 'GROQ_API_KEY=') === 0) {
                return trim(substr($line, strlen('GROQ_API_KEY=')));
            }
        }
    }
    return false;
}
$apiKey = loadEnvGroqKey();


$topic = $_GET['topic'] ?? 'JavaScript';
$level = $_GET['level'] ?? 'débutant';
$count = isset($_GET['count']) ? intval($_GET['count']) : 5;
$keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';

$prompt = <<<PROMPT
Tu es un expert en développement logiciel et en création de quiz techniques.
Génère un quiz de {$count} questions sur le thème "$topic" de niveau "$level".

Format attendu en JSON :
{
  "questions": [
    {
      "question": "texte de la question",
      "type": "multiple" ou "boolean",
      "choices": ["option1", "option2", ...] (seulement pour type multiple),
      "correctAnswer": "réponse correcte",
      "explanation": "explication courte de la réponse"
    }
  ]
}

Les questions doivent être techniques, précises et pertinentes pour des développeurs.
Mélange les types de questions (QCM et Vrai/Faux).
PROMPT;

// Préparer la requête cURL
$url = 'https://api.groq.com/openai/v1/chat/completions';
$model = 'llama-3.3-70b-versatile';

$body = [
    'model' => $model,
    'messages' => [
        [
            'role' => 'user',
            'content' => $prompt
        ]
    ],
    'response_format' => ['type' => 'json_object'],
    'temperature' => 0.7
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($response === false || $httpCode !== 200) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Erreur lors de la communication avec l\'API Groq',
        'details' => $error ?: $response
    ]);
    exit;
}

$data = json_decode($response, true);
$content = $data['choices'][0]['message']['content'] ?? null;
$quizData = json_decode($content, true);

if (!$quizData) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Réponse inattendue de l\'API Groq',
        'raw' => $content
    ]);
    exit;
}

echo json_encode($quizData);
