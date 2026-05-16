<?php

declare(strict_types=1);

namespace App\Controller;

use App\Service\ProjectRegistry;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Twig\Environment;

final class ProjectController extends AbstractController
{
    public function __construct(
        private readonly Environment $twig,
        private readonly ProjectRegistry $registry,
        #[Autowire('%kernel.environment%')] private readonly string $env,
    ) {}

    /**
     * Rendert eine Projektseite anhand des Slugs.
     * Das Template muss unter templates/projects/{slug}/index.html.twig liegen.
     * Projekte mit dev_only=true oder status=draft sind in prod nicht erreichbar.
     */
    #[Route('/{slug}', name: 'project', requirements: ['slug' => '[a-z0-9\-]+'])]
    public function show(string $slug): Response
    {
        // Zugangskontrolle: Projekt muss in der Registry vorhanden und für diese
        // Umgebung freigegeben sein.
        $project = $this->registry->findAccessible($slug, $this->env);
        if ($project === null) {
            throw new NotFoundHttpException(sprintf('Kein Projekt mit Slug "%s" gefunden.', $slug));
        }

        $template = sprintf('projects/%s/index.html.twig', $slug);

        if (!$this->twig->getLoader()->exists($template)) {
            throw new NotFoundHttpException(sprintf('Kein Projekt mit Slug "%s" gefunden.', $slug));
        }

        return $this->render($template, ['registryProject' => $project]);
    }
}
