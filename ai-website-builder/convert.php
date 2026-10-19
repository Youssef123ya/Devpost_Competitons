<?php
$d = 'e:\ai-website-builder\storage\app\laravel-base\resources\views\dashboard';
$reps = [
    'bg-slate-900' => 'bg-slate-50',
    'bg-slate-800' => 'bg-white',
    'text-slate-100' => 'text-slate-800',
    'text-slate-200' => 'text-slate-700',
    'text-slate-400' => 'text-slate-500',
    'border-slate-700/50' => 'border-slate-200',
    'bg-slate-700' => 'bg-slate-100',
    'bg-slate-700/50' => 'bg-slate-50',
    'border-slate-600/50' => 'border-slate-300',
    'text-white' => 'text-slate-900',
    'border-slate-600' => 'border-slate-300',
    'bg-slate-900/80' => 'bg-white/80',
    'text-slate-300' => 'text-slate-600',
    'text-slate-500' => 'text-slate-400',
];

$dir = new RecursiveDirectoryIterator($d);
foreach(new RecursiveIteratorIterator($dir) as $f) {
    if($f->getExtension() == 'php') {
        file_put_contents($f->getPathname(), strtr(file_get_contents($f->getPathname()), $reps));
    }
}
echo "Done.";
