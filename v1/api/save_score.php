<?php
header('Content-Type: application/json');

$filePath = __DIR__ . '/../data/scores.json';

$data = json_decode(file_get_contents('php://input'), true);
$pseudo = $data['pseudo'] ?? 'Anonyme';
$score = intval($data['score'] ?? 0);
$maxScore = intval($data['maxScore'] ?? 5);
$topic = $data['topic'] ?? 'Général';
$date = date('Y-m-d H:i:s');

// Valider les données
if ($score < 0 || $maxScore < 1 || $score > $maxScore) {
    http_response_code(400);
    echo json_encode(['error' => 'Données de score invalides']);
    exit;
}

$scores = [];
if (file_exists($filePath)) {
    $scores = json_decode(file_get_contents($filePath), true) ?: [];
}

$newScore = [
    'pseudo' => substr(trim($pseudo), 0, 20),
    'score' => $score,
    'maxScore' => $maxScore,
    'percentage' => round(($score / $maxScore) * 100),
    'topic' => $topic,
    'date' => $date
];

array_push($scores, $newScore);

if (file_put_contents($filePath, json_encode($scores, JSON_PRETTY_PRINT))) {
    echo json_encode(['success' => true, 'position' => count($scores)]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur lors de la sauvegarde']);
}
