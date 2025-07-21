<?php
header('Content-Type: application/json');

$filePath = __DIR__ . '/../data/scores.json';

// Lire les scores existants
$scores = [];
if (file_exists($filePath)) {
    $scores = json_decode(file_get_contents($filePath), true) ?: [];
}

// Filtrer par date si demandé
$filter = $_GET['filter'] ?? 'global';
$topic = isset($_GET['topic']) ? trim($_GET['topic']) : null;
$pseudo = isset($_GET['pseudo']) ? trim($_GET['pseudo']) : null;

if ($filter === 'today') {
    $today = date('Y-m-d');
    $scores = array_filter($scores, function($score) use ($today) {
        return strpos($score['date'], $today) === 0;
    });
}
if ($topic) {
    $scores = array_filter($scores, function($score) use ($topic) {
        return strtolower($score['topic']) === strtolower($topic);
    });
}
if ($pseudo) {
    $scores = array_filter($scores, function($score) use ($pseudo) {
        return strtolower($score['pseudo']) === strtolower($pseudo);
    });
}

// Trier par score (décroissant)
usort($scores, function($a, $b) {
    return $b['score'] <=> $a['score'];
});

// Limiter à 20 premiers
$topScores = array_slice($scores, 0, 20);

echo json_encode($topScores);