export function PrivacyContent() {
  return (
    <div className="cgu-doc font-sans text-[#1a1a1a]">
      <header className="text-center mb-10 mt-2">
        <h1 className="text-[#1F3864] font-bold uppercase tracking-wide text-2xl md:text-3xl mb-3">
          Politique de Confidentialité
        </h1>
        <p className="text-[#2E75B6] font-semibold text-lg mb-2">
          MedFlow — La Prépa du Peuple
        </p>
        <p className="text-gray-500 italic text-sm">
          Date de dernière mise à jour : 19 avril 2026
        </p>
      </header>

      <article className="space-y-8 text-justify leading-relaxed">
        <p>
          MedFlow — La Prépa du Peuple (ci-après « MedFlow ») accorde une importance primordiale à la protection de vos données personnelles. La présente Politique de Confidentialité décrit comment nous collectons, utilisons, stockons et protégeons vos données conformément au Règlement Général sur la Protection des Données (RGPD) et à la législation applicable.
        </p>

        <section>
          <h2 className="text-[#1F3864] font-bold text-xl mb-3">Article 1 — Identité du responsable du traitement</h2>
          <p className="mb-2">Le responsable du traitement des données personnelles est :</p>
          <ul className="list-disc pl-10 space-y-1">
            <li>Société : MedFlow</li>
            <li>Siège social : Madrid, Espagne</li>
            <li>
              Email de contact :{" "}
              <a href="mailto:medflow.laprepadupeuple@gmail.com" className="text-[#2E75B6] underline">
                medflow.laprepadupeuple@gmail.com
              </a>
            </li>
            <li>Site web : medflow-laprepadupeuple.org</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[#1F3864] font-bold text-xl mb-3">Article 2 — Données collectées</h2>

          <h3 className="text-[#2E75B6] font-semibold text-base mb-2">2.1 Données fournies directement par l'utilisateur</h3>
          <p className="mb-2">Lors de l'inscription et de l'utilisation de l'Application, nous collectons :</p>
          <ul className="list-disc pl-10 space-y-1 mb-4">
            <li>Adresse email</li>
            <li>Mot de passe (chiffré, non accessible par MedFlow)</li>
            <li>Informations de profil (université, année d'études si renseignées)</li>
            <li>Fichiers uploadés par l'utilisateur (cours PDF, documents Word, images)</li>
            <li>Contenu créé (flashcards personnelles, notes, dossiers)</li>
          </ul>

          <h3 className="text-[#2E75B6] font-semibold text-base mb-2">2.2 Données collectées automatiquement</h3>
          <p className="mb-2">Lors de l'utilisation de l'Application, nous collectons automatiquement :</p>
          <ul className="list-disc pl-10 space-y-1 mb-4">
            <li>Données de connexion (date, heure, adresse IP)</li>
            <li>Données d'utilisation (fonctionnalités utilisées, temps passé, progression)</li>
            <li>Données de performance (scores aux quiz, révisions effectuées)</li>
            <li>Données techniques (type de navigateur, système d'exploitation, appareil)</li>
          </ul>

          <h3 className="text-[#2E75B6] font-semibold text-base mb-2">2.3 Données de paiement</h3>
          <p>
            Les données de paiement (numéro de carte bancaire, IBAN) sont traitées exclusivement par notre prestataire de paiement Stripe. MedFlow ne stocke jamais vos données bancaires. Seules les informations de transaction (montant, date, statut) sont conservées dans notre système.
          </p>
        </section>

        <section>
          <h2 className="text-[#1F3864] font-bold text-xl mb-3">Article 3 — Finalités du traitement</h2>
          <p className="mb-2">Vos données personnelles sont utilisées pour les finalités suivantes :</p>
          <ul className="list-disc pl-10 space-y-1">
            <li>Création et gestion de votre compte utilisateur</li>
            <li>Fourniture des services pédagogiques de l'Application</li>
            <li>Personnalisation de votre expérience d'apprentissage</li>
            <li>Traitement des paiements et gestion des abonnements</li>
            <li>Envoi de notifications relatives au service (rappels de révision, nouveaux cours)</li>
            <li>Amélioration des fonctionnalités de l'Application</li>
            <li>Prévention des fraudes et sécurisation du service</li>
            <li>Respect de nos obligations légales et réglementaires</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[#1F3864] font-bold text-xl mb-3">Article 4 — Base légale du traitement</h2>
          <p className="mb-2">Le traitement de vos données repose sur les bases légales suivantes :</p>
          <ul className="list-disc pl-10 space-y-1">
            <li><strong>Exécution du contrat</strong> : pour fournir les services auxquels vous avez souscrit</li>
            <li><strong>Consentement</strong> : pour l'envoi de communications marketing (vous pouvez retirer votre consentement à tout moment)</li>
            <li><strong>Intérêt légitime</strong> : pour améliorer nos services et assurer la sécurité de l'Application</li>
            <li><strong>Obligation légale</strong> : pour respecter nos obligations fiscales et réglementaires</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[#1F3864] font-bold text-xl mb-3">Article 5 — Destinataires des données</h2>

          <h3 className="text-[#2E75B6] font-semibold text-base mb-2">5.1 Sous-traitants</h3>
          <p className="mb-2">Vos données peuvent être transmises à nos prestataires techniques dans le cadre de la fourniture du service :</p>
          <ul className="list-disc pl-10 space-y-1 mb-3">
            <li><strong>Supabase</strong> : hébergement de la base de données et stockage des fichiers</li>
            <li><strong>Stripe</strong> : traitement des paiements</li>
            <li><strong>Anthropic</strong> : traitement des requêtes vers l'assistant IA (les conversations sont transmises de façon anonymisée)</li>
          </ul>
          <p className="mb-4">
            Ces prestataires sont contractuellement tenus de respecter la confidentialité de vos données et ne peuvent les utiliser qu'aux fins prévues.
          </p>

          <h3 className="text-[#2E75B6] font-semibold text-base mb-2">5.2 Transferts hors UE</h3>
          <p className="mb-4">
            Certains de nos prestataires (Stripe, Anthropic, Supabase) sont établis aux États-Unis. Ces transferts sont encadrés par les clauses contractuelles types approuvées par la Commission européenne, garantissant un niveau de protection adéquat.
          </p>

          <h3 className="text-[#2E75B6] font-semibold text-base mb-2">5.3 Partage avec des tiers</h3>
          <p>
            MedFlow ne vend jamais vos données personnelles à des tiers. Vos données ne sont partagées qu'avec nos sous-traitants listés ci-dessus et uniquement dans le cadre nécessaire à la fourniture du service.
          </p>
        </section>

        <section>
          <h2 className="text-[#1F3864] font-bold text-xl mb-3">Article 6 — Durée de conservation</h2>
          <p className="mb-2">Vos données sont conservées selon les durées suivantes :</p>
          <ul className="list-disc pl-10 space-y-1 mb-3">
            <li>Données de compte : pendant toute la durée de votre abonnement + 3 ans après la clôture</li>
            <li>Données de paiement (transactions) : 10 ans conformément aux obligations comptables</li>
            <li>Données d'utilisation et de progression : pendant la durée du compte</li>
            <li>Fichiers uploadés : jusqu'à suppression par l'utilisateur ou clôture du compte</li>
            <li>Logs de connexion : 12 mois</li>
          </ul>
          <p>À l'expiration de ces délais, vos données sont supprimées ou anonymisées de manière irréversible.</p>
        </section>

        <section>
          <h2 className="text-[#1F3864] font-bold text-xl mb-3">Article 7 — Vos droits</h2>
          <p className="mb-3">Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :</p>

          <h3 className="text-[#2E75B6] font-semibold text-base mb-2">7.1 Droit d'accès</h3>
          <p className="mb-4">Vous pouvez demander à obtenir une copie de toutes les données personnelles que nous détenons vous concernant.</p>

          <h3 className="text-[#2E75B6] font-semibold text-base mb-2">7.2 Droit de rectification</h3>
          <p className="mb-4">Vous pouvez demander la correction de données inexactes ou incomplètes vous concernant.</p>

          <h3 className="text-[#2E75B6] font-semibold text-base mb-2">7.3 Droit à l'effacement</h3>
          <p className="mb-4">Vous pouvez demander la suppression de vos données personnelles, sous réserve de nos obligations légales de conservation.</p>

          <h3 className="text-[#2E75B6] font-semibold text-base mb-2">7.4 Droit à la portabilité</h3>
          <p className="mb-4">Vous pouvez demander à recevoir vos données dans un format structuré et lisible par machine pour les transférer à un autre service.</p>

          <h3 className="text-[#2E75B6] font-semibold text-base mb-2">7.5 Droit d'opposition</h3>
          <p className="mb-4">Vous pouvez vous opposer au traitement de vos données à des fins de marketing ou basé sur notre intérêt légitime.</p>

          <h3 className="text-[#2E75B6] font-semibold text-base mb-2">7.6 Droit à la limitation</h3>
          <p className="mb-4">Vous pouvez demander la limitation du traitement de vos données dans certaines circonstances.</p>

          <h3 className="text-[#2E75B6] font-semibold text-base mb-2">7.7 Exercice de vos droits</h3>
          <p>
            Pour exercer l'un de ces droits, contactez-nous à :{" "}
            <a href="mailto:medflow.laprepadupeuple@gmail.com" className="text-[#2E75B6] underline">
              medflow.laprepadupeuple@gmail.com
            </a>
            . Nous répondrons à votre demande dans un délai maximum de 30 jours. Vous avez également le droit d'introduire une réclamation auprès de l'autorité de contrôle compétente (en France : la CNIL).
          </p>
        </section>

        <section>
          <h2 className="text-[#1F3864] font-bold text-xl mb-3">Article 8 — Sécurité des données</h2>
          <p className="mb-2">
            MedFlow met en œuvre les mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, modification, divulgation ou destruction :
          </p>
          <ul className="list-disc pl-10 space-y-1 mb-3">
            <li>Chiffrement des mots de passe (hachage bcrypt)</li>
            <li>Connexions sécurisées (HTTPS/TLS)</li>
            <li>Accès aux données restreint au personnel autorisé</li>
            <li>Politiques de sécurité sur la base de données (Row Level Security)</li>
            <li>Sauvegardes régulières des données</li>
          </ul>
          <p>
            En cas de violation de données susceptible d'engendrer un risque élevé pour vos droits et libertés, nous vous en informerons dans les meilleurs délais conformément au RGPD.
          </p>
        </section>

        <section>
          <h2 className="text-[#1F3864] font-bold text-xl mb-3">Article 9 — Cookies et technologies similaires</h2>
          <p className="mb-2">L'Application utilise des cookies et technologies similaires pour :</p>
          <ul className="list-disc pl-10 space-y-1 mb-3">
            <li>Maintenir votre session de connexion</li>
            <li>Mémoriser vos préférences</li>
            <li>Analyser l'utilisation de l'Application (données anonymisées)</li>
          </ul>
          <p>Vous pouvez configurer votre navigateur pour refuser les cookies, mais cela pourrait affecter le fonctionnement de l'Application.</p>
        </section>

        <section>
          <h2 className="text-[#1F3864] font-bold text-xl mb-3">Article 10 — Mineurs</h2>
          <p>
            L'Application est destinée aux personnes âgées d'au moins 16 ans. Nous ne collectons pas sciemment de données personnelles de mineurs de moins de 16 ans. Si vous êtes le parent ou tuteur d'un mineur ayant créé un compte, contactez-nous pour supprimer ses données.
          </p>
        </section>

        <section>
          <h2 className="text-[#1F3864] font-bold text-xl mb-3">Article 11 — Modifications de la politique</h2>
          <p>
            MedFlow se réserve le droit de modifier la présente Politique de Confidentialité à tout moment. En cas de modification substantielle, vous serez informé par email ou par notification dans l'Application au moins 30 jours avant l'entrée en vigueur des nouvelles dispositions. La poursuite de l'utilisation de l'Application après notification vaut acceptation de la nouvelle politique.
          </p>
        </section>

        <section>
          <h2 className="text-[#1F3864] font-bold text-xl mb-3">Article 12 — Contact et réclamations</h2>
          <p className="mb-2">
            Pour toute question relative à la présente Politique de Confidentialité ou pour exercer vos droits :
          </p>
          <ul className="list-disc pl-10 space-y-1 mb-3">
            <li>
              Email :{" "}
              <a href="mailto:medflow.laprepadupeuple@gmail.com" className="text-[#2E75B6] underline">
                medflow.laprepadupeuple@gmail.com
              </a>
            </li>
            <li>Site web : medflow-laprepadupeuple.org</li>
            <li>Adresse : MedFlow, Madrid, Espagne</li>
          </ul>
          <p>
            Vous avez également le droit de déposer une plainte auprès de l'autorité de protection des données de votre pays de résidence. En France, il s'agit de la CNIL (www.cnil.fr).
          </p>
        </section>

        <p className="text-center text-sm text-gray-500 italic pt-6 border-t border-gray-200 mt-10">
          MedFlow — La Prépa du Peuple | 19 avril 2026
        </p>
      </article>
    </div>
  );
}
