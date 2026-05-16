<?php

declare(strict_types=1);

namespace App\Service;

/**
 * Zentrale Projektliste.
 *
 * Felder pro Eintrag:
 *   slug        – URL-Slug, muss mit templates/projects/{slug}/index.html.twig übereinstimmen
 *   title       – Anzeigename
 *   description – Kurzbeschreibung für die Projektübersicht
 *   icon        – FontAwesome-Klasse
 *   status      – 'stable' | 'beta' | 'wip' | 'draft'
 *                  'draft' → nur in der dev-Umgebung sichtbar und erreichbar
 *   tags        – string[]
 *   github_url  – string|null
 *   dev_only    – bool (optional, default false)
 *                  true  → ausschließlich in der dev-Umgebung sichtbar und erreichbar;
 *                          für Beispiel- / Platzhalter-Projekte ohne echten Inhalt
 */
final class ProjectRegistry
{
    /** @var array<int, array<string, mixed>> */
    private array $projects = [
        [
            'slug'        => 'beispiel-projekt',
            'title'       => 'Beispiel-Projekt',
            'description' => 'Zeigt alle verfügbaren Template-Komponenten — dient als Vorlage für neue Projekte.',
            'icon'        => 'fas fa-flask',
            'status'      => 'stable',
            'tags'        => ['C++17', 'Qt 6', 'CMake'],
            'github_url'  => null,
            'dev_only'    => true,
        ],
        [
            'slug'        => 'beispiel-projekt-web',
            'title'       => 'Beispiel-Projekt-Webseite',
            'description' => 'Zeigt alle verfügbaren Template-Komponenten — dient als Vorlage für neue Projekte.',
            'icon'        => 'fas fa-flask',
            'status'      => 'stable',
            'tags'        => ['PHP 8.3', 'Symfony 7', 'PostgreSQL', 'Redis', 'WebSocket', 'Docker'],
            'github_url'  => null,
            'dev_only'    => true,
        ],

        // ── Echte Projekte ────────────────────────────────────────────
        [
            'slug'        => 'kaderblick-video-manager',
            'title'       => 'Kaderblick Video Manager',
            'description' => 'Automatisierter Download, Transkodierung, Upload und Verwaltung von Videos für die Kaderblick-Plattform.',
            'icon'        => 'fas fa-video',
            'status'      => 'stable',
            'tags'        => ['Python 3.11', 'PySide 6', 'Kaderblick', 'Automatisierung', 'Workflow'],
            'github_url'  => 'https://github.com/mastercad/kaderblick-video-manager',
        ],
        [
            'slug'        => 'kaderblick-analyse-player',
            'title'       => 'Kaderblick Analyse Player',
            'description' => 'Desktop-Player für Videoanalyse im Fußball: CSV-Segmentdatei laden, Szenen anspringen, Live-Filter anwenden und Session sichern.',
            'icon'        => 'fas fa-play-circle',
            'status'      => 'stable',
            'tags'        => ['Electron', 'React', 'TypeScript', 'Kaderblick', 'Videoanalyse'],
            'github_url'  => 'https://github.com/mastercad/Kaderblick-Analyse-Player',
        ],
        [
            'slug'        => 'kaderblick-video-combiner',
            'title'       => 'Kaderblick Video Combiner',
            'description' => 'Schneide Szenen aus langen Spielaufzeichnungen, füge Titelkarten ein und lade das fertige Analysevideo direkt auf YouTube hoch.',
            'icon'        => 'fas fa-film',
            'status'      => 'wip',
            'tags'        => ['Python 3.10', 'PyQt5', 'FFmpeg', 'YouTube API', 'Kaderblick', 'Videobearbeitung'],
            'github_url'  => 'https://github.com/mastercad/Kaderblick-Video-Combiner',
        ],

        // ── Unveröffentlichte Projekte (status: 'draft') ──────────────
        // Projekte mit status 'draft' erscheinen weder im Listing noch
        // sind sie per direkter URL in der prod-Umgebung erreichbar.
        // In der dev-Umgebung sind sie unter ihrer URL aufrufbar.
        //
        // [
        //     'slug'        => 'mein-neues-projekt',
        //     'title'       => 'Mein neues Projekt',
        //     'description' => '...',
        //     'icon'        => 'fas fa-code',
        //     'status'      => 'draft',
        //     'tags'        => ['Rust'],
        //     'github_url'  => null,
        // ],
    ];

    /**
     * Alle Projekte die in der aktuellen Umgebung im Listing erscheinen sollen.
     *
     * @return array<int, array<string, mixed>>
     */
    public function retrieveVisibility(string $env): array
    {
        return array_values(array_filter(
            $this->projects,
            static fn(array $p): bool => self::isVisible($p, $env),
        ));
    }

    /**
     * Alle eindeutigen Tags aller sichtbaren Projekte.
     *
     * @return string[]
     */
    public function allTags(string $env): array
    {
        $tags = [];
        foreach ($this->retrieveVisibility($env) as $p) {
            foreach (($p['tags'] ?? []) as $tag) {
                if (!in_array($tag, $tags, true)) {
                    $tags[] = $tag;
                }
            }
        }

        return $tags;
    }

    /**
     * Tag-gefilterte, paginierte Projektliste.
     *
     * @return array{projects: array<int, array<string, mixed>>, total: int, page: int, totalPages: int}
     */
    public function retrieveFiltered(string $env, ?string $tag, int $page, int $perPage): array
    {
        $all = $this->retrieveVisibility($env);

        if ($tag !== null && $tag !== '') {
            $all = array_values(array_filter(
                $all,
                static fn(array $p): bool => in_array($tag, $p['tags'] ?? [], true),
            ));
        }

        $total      = count($all);
        $totalPages = max(1, (int) ceil($total / $perPage));
        $page       = min(max(1, $page), $totalPages);
        $offset     = ($page - 1) * $perPage;

        return [
            'projects'   => array_values(array_slice($all, $offset, $perPage)),
            'total'      => $total,
            'page'       => $page,
            'totalPages' => $totalPages,
        ];
    }

    /**
     * Einzelnes Projekt per Slug — null wenn nicht gefunden oder in dieser
     * Umgebung nicht zugänglich.
     *
     * @return array<string, mixed>|null
     */
    public function findAccessible(string $slug, string $env): ?array
    {
        foreach ($this->projects as $project) {
            if ($project['slug'] === $slug && self::isAccessible($project, $env)) {
                return $project;
            }
        }

        return null;
    }

    /**
     * Darf das Projekt im Listing erscheinen?
     * Gilt auch für direkte URL-Zugriffe als erstes Filter-Kriterium.
     *
     * @param array<string, mixed> $p
     */
    private static function isVisible(array $p, string $env): bool
    {
        if ($env === 'dev') {
            // In dev alles anzeigen außer explizit ausgeblendet (kein solches Flag vorgesehen)
            return true;
        }

        // prod / test: dev_only und draft ausblenden
        if (!empty($p['dev_only'])) {
            return false;
        }

        if (($p['status'] ?? '') === 'draft') {
            return false;
        }

        return true;
    }

    /**
     * Ist das Projekt per direkter URL erreichbar?
     *
     * @param array<string, mixed> $p
     */
    private static function isAccessible(array $p, string $env): bool
    {
        return self::isVisible($p, $env);
    }
}
