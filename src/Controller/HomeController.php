<?php

declare(strict_types=1);

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class HomeController extends AbstractController
{
    /**
     * Statische Projektliste — kein Datenbankzugriff.
     * Neue Projekte hier eintragen und entsprechende Template-Datei anlegen.
     */
    private function getProjects(): array
    {
        return [
            [
                'slug'        => 'beispiel-projekt',
                'title'       => 'Beispiel-Projekt',
                'description' => 'Eine kurze, prägnante Beschreibung was dieses Projekt macht und warum es existiert.',
                'icon'        => 'fas fa-box-open',
                'status'      => 'stable',
                'tags'        => ['PHP 8.3', 'Symfony 7'],
                'github_url'  => 'https://github.com/byte-artist/beispiel-projekt',
            ],
            // Weitere Projekte hier eintragen:
            // [
            //     'slug'        => 'mein-projekt',
            //     'title'       => 'Mein Projekt',
            //     'description' => '...',
            //     'icon'        => 'fas fa-code',
            //     'status'      => 'beta',
            //     'tags'        => ['PHP', 'MySQL'],
            //     'github_url'  => null,
            // ],
        ];
    }

    #[Route('/', name: 'home')]
    public function index(): Response
    {
        return $this->render('home/index.html.twig', [
            'projects' => $this->getProjects(),
        ]);
    }
}
