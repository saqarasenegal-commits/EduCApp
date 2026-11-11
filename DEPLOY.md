# Mise en ligne d'EduCApp : GitHub + Vercel + Supabase + domaine Hostinger

Ce qui est déjà prêt :
- l'application, compatible Vercel (`api/index.js`, `vercel.json`) ;
- le **code d'accès**, actif dès que la variable `ACCESS_CODE` est définie ;
- la base **Supabase « educapp »** (région Paris), avec ses tables `edu_students`, `edu_results` et `edu_quizzes`. Leur définition est dans `supabase/schema.sql` ;
- l'URL du projet Supabase : `https://gviexsfcklozhhpucenv.supabase.co`.

---

## 1. Récupérer la clé secrète Supabase

1. Va sur https://supabase.com/dashboard, puis ouvre le projet **educapp**.
2. Va dans **Project Settings → API Keys**.
3. Copie la **Secret key**, qui commence par `sb_secret_…`.
   ⚠️ Cette clé est un mot de passe. Ne la mets **jamais** dans le code ni sur GitHub : seulement dans `.env` et dans Vercel.

*(Optionnel) Pour tester la base en local, ajoute ces lignes dans `.env`, puis relance `npm start` :*

```
SUPABASE_URL=https://gviexsfcklozhhpucenv.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
```

Au démarrage, le terminal doit afficher `storage: supabase`.

## 2. Mettre le code sur GitHub

Git n'est pas installé sur ce PC. Deux possibilités :

**A. GitHub Desktop (le plus simple)** : installe-le depuis https://desktop.github.com, puis :
1. File → **Add local repository** → choisis `C:\dev\EduCApp` → « create a repository ».
2. Fais un **Commit**, puis **Publish repository**. Laisse la case **« Keep this code private »** cochée.

**B. En ligne de commande** : installe Git, puis rouvre le terminal :

```bash
winget install --id Git.Git -e
```

Crée ensuite un dépôt **privé** vide sur https://github.com/new (par exemple `educapp`), puis, dans `C:\dev\EduCApp` :

```bash
git init
git add .
git commit -m "EduCApp: AI home tutor"
git branch -M main
git remote add origin https://github.com/TON-COMPTE/educapp.git
git push -u origin main
```

Le fichier `.gitignore` exclut déjà `.env` (tes clés), `node_modules/` et `data/`.

## 3. Déployer sur Vercel

1. Va sur https://vercel.com, connecte-toi avec ton compte GitHub, puis **Add New → Project** et importe le dépôt `educapp`.
2. Pour **Framework Preset**, laisse **Other**. Le fichier `vercel.json` règle le reste.
3. Dans **Environment Variables**, ajoute :

   | Nom | Valeur |
   |---|---|
   | `ANTHROPIC_API_KEY` | ta clé Anthropic |
   | `ACCESS_CODE` | le code que tu donneras aux testeurs (ex. `ecole2026`) |
   | `SUPABASE_URL` | `https://gviexsfcklozhhpucenv.supabase.co` |
   | `SUPABASE_SECRET_KEY` | la clé `sb_secret_…` de l'étape 1 |

4. Clique sur **Deploy**. Vercel te donne une adresse du type `https://educapp-xxx.vercel.app`.

Ensuite, chaque `push` sur GitHub redéploie automatiquement l'application.

## 4. Brancher ton domaine Hostinger

1. Dans Vercel, va dans le projet, puis **Settings → Domains** → ajoute par exemple `tuteur.tondomaine.com`.
2. Vercel affiche l'enregistrement DNS à créer. C'est en général un **CNAME** `tuteur` qui pointe vers une adresse `…vercel-dns.com`. Copie **exactement** la valeur affichée par Vercel.
3. Dans **Hostinger → hPanel → Domaines → DNS / Nameservers**, ajoute ce CNAME (nom : `tuteur`, cible : la valeur donnée par Vercel).
4. Attends quelques minutes, parfois jusqu'à quelques heures. Vercel active le HTTPS automatiquement.

## 5. Partager

Envoie à tes testeurs **le lien** et **le code d'accès**. Ils entrent le code une seule fois par appareil, puis peuvent ajouter le site à leur écran d'accueil.

Pour couper l'accès à tout le monde, change `ACCESS_CODE` dans Vercel et redéploie (Deployments → … → Redeploy).

## Bon à savoir

- **Coûts :**
  - Supabase : 10 $/mois pour ce projet.
  - Anthropic : facturé à l'usage, quelques centimes par cours ou épreuve. Tu peux définir une limite de dépense dans la console Anthropic.
  - Vercel : gratuit avec l'offre Hobby, réservée à un usage non commercial.
- **Durée d'exécution :** un cours prend environ 30 s à générer. `vercel.json` autorise jusqu'à 300 s par requête. Si Vercel refuse cette valeur avec ton offre, baisse `maxDuration` à `60`.
- Tous les testeurs partagent la même liste d'élèves. Donne à chaque élève un nom reconnaissable.
