<?php

declare(strict_types=1);

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class DevController extends AbstractController
{
    public function __construct(
        #[Autowire('%kernel.environment%')] private readonly string $env,
    ) {}

    #[Route('/_dev/icons', name: 'dev_icons')]
    public function icons(): Response
    {
        if ($this->env !== 'dev') {
            throw $this->createNotFoundException();
        }

        return $this->render('dev/icons.html.twig');
    }
}
