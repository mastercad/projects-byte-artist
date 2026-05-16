<?php

declare(strict_types=1);

namespace App\Controller;

use App\Service\ProjectRegistry;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class HomeController extends AbstractController
{
    public function __construct(
        private readonly ProjectRegistry $registry,
        #[Autowire('%kernel.environment%')] private readonly string $env,
    ) {}

    #[Route('/', name: 'home')]
    public function index(Request $request): Response
    {
        $tag     = $request->query->get('tag') ?: null;
        $page    = max(1, (int) $request->query->get('page', '1'));
        $perPage = 9;

        $result = $this->registry->retrieveFiltered($this->env, $tag, $page, $perPage);

        return $this->render('home/index.html.twig', [
            'projects'   => $result['projects'],
            'activeTag'  => $tag,
            'allTags'    => $this->registry->allTags($this->env),
            'page'       => $result['page'],
            'totalPages' => $result['totalPages'],
        ]);
    }
}
