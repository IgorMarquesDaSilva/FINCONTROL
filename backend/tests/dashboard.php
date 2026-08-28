<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$index = (string) file_get_contents($root . '/index.php');
$css = (string) file_get_contents($root . '/assets/css/style.css');
$js = (string) file_get_contents($root . '/assets/js/app.js');

$expectations = [
    'dashboard main heading' => str_contains($index, 'Visão geral'),
    'primary navigation' => str_contains($index, 'Dashboard') && str_contains($index, 'Transações') && str_contains($index, 'Orçamentos') && str_contains($index, 'Metas'),
    'financial summary cards' => str_contains($index, 'Saldo atual') && str_contains($index, 'Receitas') && str_contains($index, 'Despesas'),
    'demo data marker' => str_contains($index, 'Dados de demonstração'),
    'mobile menu control' => str_contains($index, 'data-menu-toggle') && str_contains($js, 'data-menu-toggle'),
    'responsive breakpoint' => str_contains($css, '@media (max-width: 900px)'),
];

$failures = 0;
foreach ($expectations as $name => $passed) {
    if ($passed) {
        echo "[PASS] {$name}\n";
        continue;
    }
    $failures++;
    fwrite(STDERR, "[FAIL] {$name}\n");
}

exit($failures === 0 ? 0 : 1);
