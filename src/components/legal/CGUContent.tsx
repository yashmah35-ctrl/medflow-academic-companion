export function CGUContent() {
  return (
    <div className="cgu-doc font-sans text-[#1a1a1a]">
      {/* En-tête centré façon Word */}
      <header className="text-center mb-10 mt-2">
        <h1 className="text-[#1F3864] font-bold uppercase tracking-wide text-2xl md:text-3xl mb-3">
          Conditions Générales d'Utilisation
        </h1>
        <p className="text-[#2E75B6] font-semibold text-lg mb-2">
          MedFlow — La Prépa du Peuple
        </p>
        <p className="text-gray-500 italic text-sm">
          Date de dernière mise à jour : 4 juin 2025
        </p>
      </header>

      <article className="space-y-8 text-justify leading-relaxed">
        <section>
          <h2 className="text-[#1F3864] font-bold text-xl mb-3">Article 1 — Présentation de l'application</h2>
          <p className="mb-3">
            MedFlow — La Prépa du Peuple (ci-après « l'Application ») est une plateforme d'apprentissage en ligne destinée aux étudiants en première et deuxième année de médecine (PASS/LAS) en France. L'Application est éditée par MedFlow, dont le siège social est situé à Madrid, Espagne.
          </p>
          <p className="mb-2">L'Application propose notamment les services suivants :</p>
          <ul className="list-disc pl-10 space-y-1">
            <li>Accès à des cours et ressources pédagogiques</li>
            <li>Génération de flashcards par intelligence artificielle</li>
            <li>Modules interactifs (quiz, schémas, tableau périodique)</li>
            <li>Outils de révision (annales, examens blancs, khôlles)</li>
            <li>Assistant IA pédagogique</li>
            <li>Système de révision espacée (Spaced Repetition System)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[#1F3864] font-bold text-xl mb-3">Article 2 — Acceptation des conditions</h2>
          <p className="mb-3">
            L'utilisation de l'Application implique l'acceptation pleine et entière des présentes Conditions Générales d'Utilisation (CGU). Si vous n'acceptez pas ces conditions, vous devez cesser d'utiliser l'Application immédiatement.
          </p>
          <p>
            MedFlow se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications par email ou par notification dans l'Application. La poursuite de l'utilisation de l'Application après notification vaut acceptation des nouvelles conditions.
          </p>
        </section>

        <section>
          <h2 className="text-[#1F3864] font-bold text-xl mb-3">Article 3 — Inscription et compte utilisateur</h2>
          <h3 className="text-[#2E75B6] font-semibold text-base mb-2">3.1 Création de compte</h3>
          <p className="mb-4">
            Pour accéder à l'ensemble des fonctionnalités de l'Application, l'utilisateur doit créer un compte en fournissant une adresse email valide et un mot de passe sécurisé. L'utilisateur s'engage à fournir des informations exactes et à les maintenir à jour.
          </p>
          <h3 className="text-[#2E75B6] font-semibold text-base mb-2">3.2 Sécurité du compte</h3>
          <p className="mb-4">
            L'utilisateur est seul responsable de la confidentialité de ses identifiants de connexion. Toute utilisation du compte avec les identifiants de l'utilisateur est réputée effectuée par ce dernier. En cas de compromission du compte, l'utilisateur doit contacter MedFlow immédiatement.
          </p>
          <h3 className="text-[#2E75B6] font-semibold text-base mb-2">3.3 Comptes mineurs</h3>
          <p>
            L'Application est destinée aux étudiants âgés d'au moins 16 ans. Les utilisateurs de moins de 16 ans doivent obtenir le consentement de leur représentant légal avant toute inscription.
          </p>
        </section>

        <section>
          <h2 className="text-[#1F3864] font-bold text-xl mb-3">Article 4 — Abonnement et tarification</h2>
          <h3 className="text-[#2E75B6] font-semibold text-base mb-2">4.1 Offre gratuite</h3>
          <p className="mb-4">
            Une partie des fonctionnalités de l'Application est accessible gratuitement, notamment : la consultation des cours ENT synchronisés, les flashcards de base et l'emploi du temps.
          </p>
          <h3 className="text-[#2E75B6] font-semibold text-base mb-2">4.2 Abonnement Premium</h3>
          <p className="mb-2">
            L'accès complet à l'Application nécessite la souscription d'un abonnement mensuel au tarif de 10 euros (€) par mois. L'abonnement Premium donne accès à :
          </p>
          <ul className="list-disc pl-10 space-y-1 mb-4">
            <li>Les cours de La Prépa du Peuple</li>
            <li>Les modules interactifs complets</li>
            <li>Les annales, examens blancs et khôlles</li>
            <li>Le cahier d'erreurs</li>
            <li>L'assistant IA avec crédits mensuels</li>
          </ul>
          <h3 className="text-[#2E75B6] font-semibold text-base mb-2">4.3 Système de crédits IA</h3>
          <p className="mb-4">
            Les abonnés Premium reçoivent 4 000 crédits IA par mois. Chaque utilisation de l'assistant IA consomme 25 crédits. Des packs de crédits supplémentaires peuvent être achetés séparément.
          </p>
          <h3 className="text-[#2E75B6] font-semibold text-base mb-2">4.4 Paiement et renouvellement</h3>
          <p className="mb-4">
            Le paiement est effectué via la plateforme sécurisée Stripe. L'abonnement est renouvelé automatiquement chaque mois sauf résiliation. MedFlow se réserve le droit de modifier les tarifs avec un préavis de 30 jours.
          </p>
          <h3 className="text-[#2E75B6] font-semibold text-base mb-2">4.5 Résiliation</h3>
          <p>
            L'utilisateur peut résilier son abonnement à tout moment depuis son espace personnel. La résiliation prend effet à la fin de la période d'abonnement en cours. Aucun remboursement ne sera effectué pour la période déjà payée.
          </p>
        </section>

        <section>
          <h2 className="text-[#1F3864] font-bold text-xl mb-3">Article 5 — Codes promotionnels et programme d'affiliation</h2>
          <p>
            MedFlow propose un programme d'affiliation permettant à des partenaires (influenceurs, ambassadeurs) de partager des codes promotionnels offrant une réduction sur l'abonnement. Les codes sont soumis à des conditions spécifiques communiquées lors de leur création. MedFlow se réserve le droit de désactiver tout code promotionnel sans préavis.
          </p>
        </section>

        <section>
          <h2 className="text-[#1F3864] font-bold text-xl mb-3">Article 6 — Propriété intellectuelle</h2>
          <p className="mb-3">
            L'ensemble du contenu de l'Application (textes, images, vidéos, flashcards, modules, code informatique) est la propriété exclusive de MedFlow ou de ses partenaires et est protégé par les lois relatives à la propriété intellectuelle.
          </p>
          <p className="mb-2">Il est strictement interdit de :</p>
          <ul className="list-disc pl-10 space-y-1">
            <li>Reproduire, copier ou distribuer le contenu de l'Application sans autorisation</li>
            <li>Revendre ou céder votre accès à un tiers</li>
            <li>Utiliser le contenu à des fins commerciales sans accord préalable</li>
            <li>Tenter de décompiler ou d'accéder au code source de l'Application</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[#1F3864] font-bold text-xl mb-3">Article 7 — Protection des données personnelles</h2>
          <h3 className="text-[#2E75B6] font-semibold text-base mb-2">7.1 Données collectées</h3>
          <p className="mb-4">
            MedFlow collecte les données suivantes : adresse email, données de connexion, données d'utilisation de l'Application, données de paiement (traitées par Stripe).
          </p>
          <h3 className="text-[#2E75B6] font-semibold text-base mb-2">7.2 Utilisation des données</h3>
          <p className="mb-4">
            Les données sont utilisées pour : fournir les services de l'Application, personnaliser l'expérience d'apprentissage, améliorer les fonctionnalités, envoyer des communications relatives au service.
          </p>
          <h3 className="text-[#2E75B6] font-semibold text-base mb-2">7.3 Conservation des données</h3>
          <p className="mb-4">
            Les données sont conservées pendant la durée de l'abonnement et 3 ans après la clôture du compte, sauf obligation légale contraire.
          </p>
          <h3 className="text-[#2E75B6] font-semibold text-base mb-2">7.4 Droits des utilisateurs</h3>
          <p>
            Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits d'accès, de rectification, d'effacement, de portabilité et d'opposition sur vos données personnelles. Pour exercer ces droits, contactez-nous à l'adresse indiquée à l'Article 10.
          </p>
        </section>

        <section>
          <h2 className="text-[#1F3864] font-bold text-xl mb-3">Article 8 — Responsabilité</h2>
          <p className="mb-2">
            MedFlow s'engage à assurer la disponibilité de l'Application dans la mesure du possible. Cependant, MedFlow ne saurait être tenu responsable en cas :
          </p>
          <ul className="list-disc pl-10 space-y-1 mb-3">
            <li>D'interruption temporaire du service pour maintenance</li>
            <li>De perte de données due à un cas de force majeure</li>
            <li>D'utilisation incorrecte de l'Application par l'utilisateur</li>
            <li>De résultats académiques de l'utilisateur</li>
          </ul>
          <p>
            Le contenu pédagogique de l'Application est fourni à titre indicatif. MedFlow ne garantit pas l'exhaustivité de toutes les informations.
          </p>
        </section>

        <section>
          <h2 className="text-[#1F3864] font-bold text-xl mb-3">Article 9 — Comportement des utilisateurs</h2>
          <p className="mb-2">
            L'utilisateur s'engage à utiliser l'Application de manière licite et respectueuse. Sont strictement interdits :
          </p>
          <ul className="list-disc pl-10 space-y-1 mb-3">
            <li>Le partage de compte avec d'autres personnes</li>
            <li>Toute tentative de piratage ou d'accès non autorisé</li>
            <li>La publication de contenu illégal, diffamatoire ou offensant</li>
            <li>L'utilisation de l'Application à des fins frauduleuses</li>
          </ul>
          <p>
            MedFlow se réserve le droit de suspendre ou supprimer tout compte en cas de violation de ces règles, sans remboursement.
          </p>
        </section>

        <section>
          <h2 className="text-[#1F3864] font-bold text-xl mb-3">Article 10 — Contact</h2>
          <p className="mb-2">
            Pour toute question relative aux présentes CGU ou à l'utilisation de l'Application, vous pouvez nous contacter :
          </p>
          <ul className="list-disc pl-10 space-y-1">
            <li>
              Par email :{" "}
              <a href="mailto:medflow.laprepadupeuple@gmail.com" className="text-[#2E75B6] underline">
                medflow.laprepadupeuple@gmail.com
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-[#1F3864] font-bold text-xl mb-3">Article 11 — Droit applicable</h2>
          <p>
            Les présentes CGU sont soumises au droit espagnol. En cas de litige, et à défaut de résolution amiable, les tribunaux compétents de Madrid seront seuls compétents.
          </p>
        </section>

        <p className="text-center text-sm text-gray-500 italic pt-6 border-t border-gray-200 mt-10">
          MedFlow — La Prépa du Peuple | 4 juin 2025
        </p>
      </article>
    </div>
  );
}

export function PlaceholderContent({ title }: { title: string }) {
  return (
    <div className="text-center py-10">
      <p className="text-gray-600 italic mb-3">
        Le contenu de la section « {title} » sera publié prochainement.
      </p>
      <p className="text-sm">
        Pour toute question d'ici là, contactez-nous à{" "}
        <a href="mailto:medflow.laprepadupeuple@gmail.com" className="text-[#2E75B6] underline">
          medflow.laprepadupeuple@gmail.com
        </a>
        .
      </p>
    </div>
  );
}
