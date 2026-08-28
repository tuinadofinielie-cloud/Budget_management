# 💜 Finance App — Master Specification

> **Source of truth for Claude Code / Codex / AI coding agents**
>
> Goal: build a polished, production-ready personal finance mobile application with Flutter + Laravel API, local SQLite caching/offline support, and a deployment path to Laravel Cloud.

---

# 1. Product vision

Build a personal finance application that answers one question immediately:

> **« Combien puis-je réellement dépenser aujourd'hui sans foutre mon mois en l'air ? »**

The app must make money management simple, visual, fast and non-judgmental.

Core capabilities:

- track income;
- track expenses;
- manage budgets;
- manage savings;
- manage accounts/payment methods;
- analyze spending;
- calculate remaining daily budget;
- warn the user when spending too quickly;
- provide a future **« Puis-je me permettre ça ? »** feature.

The app should feel like a premium fintech product, not an accounting spreadsheet.

---

# 2. IMPORTANT — The application must NOT be one page

The reference mockup is **only a visual/style reference**.

It does **NOT** mean the application should contain one single page.

The implementation must contain a complete multi-screen application.

At minimum, build these screens:

1. Splash
2. Onboarding 1
3. Onboarding 2
4. Onboarding 3
5. Login
6. Register
7. Forgot password
8. Dashboard / Home
9. All transactions
10. Transaction details
11. Add expense
12. Add income
13. Add transfer
14. Budgets
15. Budget details
16. Statistics
17. Savings goals
18. Savings goal details
19. Accounts / Wallets
20. Account details
21. « Can I afford it? »
22. Notifications
23. Profile
24. Settings
25. Categories management
26. Create / edit category

Some screens can be implemented as bottom sheets, dialogs or nested navigation instead of completely separate routes when that creates a better UX.

The mockup is a **design direction**, not a literal screen-count specification.

---

# 3. Visual identity

## Style

Premium fintech + Liquid Glass.

Keywords:

- modern;
- clean;
- minimal;
- elegant;
- soft;
- premium;
- glassmorphism;
- liquid glass;
- subtle gradients;
- large rounded cards;
- floating components;
- smooth animations.

The UI should feel inspired by modern iOS/fintech interfaces while remaining original.

Do NOT copy another application's exact UI.

---

# 4. Color system

Primary brand color:

```text
Purple: #7C5CFF
```

Suggested palette:

```text
Primary:       #7C5CFF
Primary Dark:  #5B3FD4
Primary Light: #A98CFF

Background:    #F7F5FF
Surface:       #FFFFFF

Text:          #17152A
Secondary:     #77738A

Success:       #35B77A
Warning:       #FFB547
Danger:        #FF5C73
Info:          #5D8CFF
```

Do not use green as the main brand color.

Purple must clearly replace the green visual language from the reference.

---

# 5. Liquid Glass system

Liquid Glass is a major part of the visual identity.

Use it intelligently rather than applying it to every component.

Typical glass surface:

```text
background:
rgba(255,255,255,0.45 - 0.70)

border:
1px solid rgba(255,255,255,0.60 - 0.80)

blur:
16px - 30px

border radius:
20px - 32px

shadow:
very soft
```

Use:

- translucent cards;
- blurred background;
- subtle highlights;
- white glass borders;
- purple glow;
- layered surfaces;
- floating elements.

The effect should remain readable and performant.

---

# 6. Typography

Use a modern sans-serif font.

Recommended:

```text
Inter
```

or a similar clean modern font.

Hierarchy:

```text
Large balance: 32-40 px
Screen title: 26-30 px
Section title: 18-22 px
Body: 14-16 px
Caption: 11-13 px
```

Use generous spacing.

Avoid dense accounting-software layouts.

---

# 7. Navigation

Primary mobile navigation:

```text
Home
Statistics
+
Budget
Profile
```

The center `+` action should be visually prominent.

Pressing `+` opens:

```text
Add expense
Add income
Transfer
```

Use a custom floating / glass navigation bar where appropriate.

---

# 8. Splash screen

Minimal brand introduction.

Content:

```text
[Logo]

Finance App
```

Use:

- purple gradient;
- subtle glass shapes;
- short animation;
- smooth transition to onboarding/auth.

---

# 9. Onboarding

Use 3 screens.

## Onboarding 1

Title:

> **Prenez le contrôle de votre argent**

Subtitle:

> Suivez facilement vos revenus et vos dépenses.

Visual:

- floating financial cards;
- purple glass bubbles;
- abstract wallet / coins.

---

## Onboarding 2

Title:

> **Comprenez où va votre argent**

Subtitle:

> Visualisez vos habitudes de dépenses grâce à des statistiques simples.

Visual:

- donut chart;
- glass cards;
- spending categories.

---

## Onboarding 3

Title:

> **Atteignez vos objectifs**

Subtitle:

> Épargnez intelligemment et gardez toujours une longueur d'avance.

Visual:

- savings progress;
- target;
- purple glow.

Actions:

```text
Passer
Continuer
Commencer
```

---

# 10. Authentication

## Login

Fields:

```text
Email
Password
```

Actions:

```text
Se connecter
Mot de passe oublié ?
Créer un compte
```

---

## Register

Fields:

```text
Name
Email
Password
Confirm password
```

---

## Forgot password

Email field + password reset flow.

---

# 11. Home / Dashboard

This is the most important screen.

## Header

Show:

```text
Bonjour 👋
[User name]

[Notification]
```

Example:

> Bonjour Jackson 👋
>
> Voici votre situation financière.

---

## Main balance card

Large Liquid Glass / purple gradient card.

Show:

```text
Solde total

125 430 F
```

Then:

```text
Revenus
+100 000 F

Dépenses
-37 250 F
```

Include:

- mini graph;
- subtle trend;
- account summary.

---

# 12. Quick actions

Display:

```text
+ Dépense
+ Revenu
⇄ Transfert
••• Plus
```

Use rounded glass buttons.

---

# 13. Budget overview

Home should show important budgets.

Example:

```text
Vie courante
18 500 / 30 000 F

████████░░ 62 %

Épargne
10 000 / 10 000 F

██████████ 100 %
```

Allow tapping a budget to open its details.

---

# 14. Daily spending recommendation

Dashboard must calculate:

```text
Budget restant:
23 000 F

Jours restants:
20

Conseil:
1 150 F / jour
```

This value updates automatically.

Formula:

```text
remaining_budget / remaining_days
```

A more advanced version may consider planned recurring expenses.

---

# 15. Recent transactions

Show 5-10 latest transactions.

Each item:

```text
Icon
Category
Description
Date
Amount
```

Example:

```text
🍴 Nourriture
Déjeuner
Aujourd'hui
-2 500 F
```

```text
💼 Stage
Revenu
24 septembre
+50 000 F
```

Button:

```text
Voir tout
```

opens the full transactions screen.

---

# 16. Transactions screen

Dedicated screen for ALL transactions.

Features:

- search;
- filter by category;
- filter by account;
- filter by type;
- filter by date;
- sorting;
- transaction list.

Filters:

```text
Toutes
Dépenses
Revenus
Transferts
```

---

# 17. Transaction details

Show:

```text
Amount
Category
Account
Date
Description
Created at
```

Actions:

```text
Modifier
Supprimer
```

Deletion must require confirmation.

---

# 18. Add expense

Make this extremely fast.

Goal:

> Add an expense in under 5 seconds.

UI:

```text
Montant

[ category ]

Compte

Date

Note
```

Categories:

```text
🍚 Nourriture
⛽ Essence
🚗 Transport
🏠 Logement
📱 Téléphone / Internet
📚 Études
🎮 Loisirs
🛍️ Shopping
❤️ Santé
🆘 Imprévus
📦 Autres
```

Primary action:

```text
Ajouter la dépense
```

---

# 19. Add income

Fields:

```text
Montant
Source
Compte
Date
Récurrent ?
Note
```

Sources:

```text
Stage
Projet
Freelance
Salaire
Cadeau
Autres
```

---

# 20. Transfers

Allow money movement between accounts.

Example:

```text
Orange Money
     ↓
Cash
```

A transfer must NOT count as income or expense.

---

# 21. Budgets screen

Dedicated page.

Show:

```text
Budget du mois
```

Each category:

```text
Nourriture
12 500 / 20 000 F

62 %
```

Use visual progress bars.

Statuses:

```text
Normal
Attention
Dépassement
```

---

# 22. Budget details

Show:

- allocated amount;
- spent amount;
- remaining amount;
- daily recommendation;
- transactions;
- spending trend.

Actions:

```text
Modifier le budget
```

---

# 23. Automatic income allocation

When a user receives money, suggest a distribution.

Example:

```text
Revenu : 50 000 F

Vie courante     30 000 F
Épargne          10 000 F
Réserve          10 000 F
```

Default model:

```text
Vie courante: 60 %
Épargne:      20 %
Réserve:      20 %
```

The user can customize these percentages.

The system must never move money automatically without explicit user confirmation.

---

# 24. Savings goals

Screen:

```text
Mes objectifs
```

Example:

```text
💻 Nouveau PC

125 000 / 500 000 F

25 %
```

Allow:

- create;
- edit;
- delete;
- add money;
- withdraw money;
- set target date.

---

# 25. Savings goal details

Display:

```text
Goal name
Target amount
Current amount
Remaining
Target date
Progress
```

Show an attractive animated progress visualization.

---

# 26. Accounts / wallets

Allow several money sources:

```text
Cash
Orange Money
Moov Money
Bank
Card
Other
```

Each account contains:

```text
Name
Type
Balance
Currency
```

---

# 27. Statistics

Dedicated full screen.

Filters:

```text
Today
Week
Month
Year
Custom
```

Summary:

```text
Income
Expenses
Net balance
```

---

# 28. Spending distribution

Donut chart.

Example:

```text
Nourriture       40 %
Transport        25 %
Logement         15 %
Loisirs          10 %
Autres           10 %
```

Tap category → open details.

---

# 29. Spending evolution

Use:

- line chart;
- bar chart;
- monthly comparison.

Example:

```text
May
June
July
August
September
October
```

Charts must be readable and touch-friendly.

---

# 30. Notifications

Notifications screen.

Examples:

```text
⚠️ Ton budget nourriture est presque atteint.

🟢 Tu as économisé 10 000 F cette semaine.

🔴 Tes dépenses sont 30 % plus élevées que la semaine dernière.
```

Avoid notification spam.

---

# 31. « Puis-je me permettre ça ? »

Important future feature.

User enters:

```text
Casque
15 000 F
```

System evaluates:

- current available balance;
- current budgets;
- savings commitments;
- emergency reserve;
- upcoming recurring expenses;
- remaining days.

Result:

### Positive

```text
🟢 Oui

Tu peux te le permettre.

Il te resterait :
42 000 F
```

### Warning

```text
🟠 Possible, mais attention.

Cet achat risque de réduire ton budget nourriture.
```

### Negative

```text
🔴 Achat déconseillé.

Cette dépense ferait passer ta réserve
sous ton minimum de sécurité.
```

The recommendation must explain WHY.

---

# 32. Profile

Show:

```text
Avatar
Name
Email
Currency
```

Actions:

```text
Modifier le profil
Gérer les catégories
Paramètres
Notifications
Sécurité
Déconnexion
```

---

# 33. Settings

Include:

```text
Devise
Notifications
Budget daily reminder
Theme
Biometric lock (future)
Language
```

Themes:

```text
Light
Dark
System
```

Dark mode should preserve the purple Liquid Glass identity.

---

# 34. Data model

## User

```text
id
name
email
password
avatar
currency
created_at
updated_at
```

---

## Transaction

```text
id
user_id
type
amount
category_id
account_id
description
date
created_at
updated_at
```

Types:

```text
income
expense
transfer
```

---

## Category

```text
id
user_id
name
icon
color
type
created_at
updated_at
```

---

## Account

```text
id
user_id
name
type
balance
currency
created_at
updated_at
```

---

## Budget

```text
id
user_id
category_id
amount
period
start_date
end_date
created_at
updated_at
```

---

## SavingsGoal

```text
id
user_id
name
target_amount
current_amount
target_date
created_at
updated_at
```

---

## AllocationProfile

```text
id
user_id
daily_percent
savings_percent
reserve_percent
created_at
updated_at
```

---

# 35. Architecture

## Mobile

Flutter.

Recommended structure:

```text
lib/
├── core/
│   ├── theme/
│   ├── constants/
│   ├── routing/
│   ├── utils/
│   └── services/
│
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── transactions/
│   ├── budgets/
│   ├── statistics/
│   ├── savings/
│   ├── accounts/
│   ├── notifications/
│   └── profile/
│
├── shared/
│   ├── widgets/
│   ├── components/
│   └── models/
│
└── main.dart
```

Use a maintainable state-management solution.

Do NOT put business logic directly inside UI widgets.

---

# 36. Local SQLite

Flutter must have a local SQLite database.

Purpose:

- cache data;
- offline access;
- faster UI;
- queue unsynchronized transactions.

Suggested flow:

```text
Flutter UI
    ↓
Repository
    ↓
Local SQLite
    ↓
Sync layer
    ↓
Laravel API
```

SQLite is NOT the permanent cloud source of truth.

Laravel/cloud data is the authoritative source.

---

# 37. Laravel backend

Laravel exposes a REST API.

Responsibilities:

- authentication;
- authorization;
- validation;
- business rules;
- transactions;
- budgets;
- statistics;
- savings;
- account management;
- sync;
- notifications.

Example endpoints:

```text
POST /api/register
POST /api/login
POST /api/logout

GET /api/dashboard

GET /api/transactions
POST /api/transactions
GET /api/transactions/{id}
PUT /api/transactions/{id}
DELETE /api/transactions/{id}

GET /api/categories
POST /api/categories
PUT /api/categories/{id}
DELETE /api/categories/{id}

GET /api/accounts
POST /api/accounts
PUT /api/accounts/{id}

GET /api/budgets
POST /api/budgets
PUT /api/budgets/{id}

GET /api/statistics

GET /api/savings-goals
POST /api/savings-goals
PUT /api/savings-goals/{id}
DELETE /api/savings-goals/{id}
```

Use Laravel API authentication such as Sanctum.

---

# 38. Development database

IMPORTANT:

The developer must NOT be required to manually configure MySQL/PostgreSQL locally.

Use SQLite during local development.

Laravel:

```text
SQLite
```

Flutter:

```text
SQLite
```

The project must include the necessary setup/migrations so that a developer can clone the repository and start development with minimal configuration.

No phpMyAdmin requirement.

No local MySQL server requirement.

No local PostgreSQL requirement.

---

# 39. Production database

When deployed:

```text
Flutter
    ↓ HTTPS
Laravel Cloud
    ↓
Production database
```

Production database can be:

```text
PostgreSQL
```

or:

```text
MySQL
```

The exact provider/database should be configurable through environment variables.

Do NOT hard-code credentials.

---

# 40. Laravel Cloud deployment

Target production architecture:

```text
Flutter mobile app
        ↓
      HTTPS
        ↓
Laravel Cloud
        ↓
Laravel API
        ↓
Managed production DB
```

The backend must be prepared for Laravel Cloud deployment.

Environment variables:

```text
APP_ENV
APP_KEY
APP_URL

DB_CONNECTION
DB_HOST
DB_PORT
DB_DATABASE
DB_USERNAME
DB_PASSWORD
```

No secrets committed to Git.

---

# 41. Offline-first behavior

If Internet is unavailable:

User should still be able to:

- see cached balance;
- see cached transactions;
- add expenses;
- add income;
- edit local data when possible.

Transactions created offline receive a local synchronization state:

```text
pending
synced
failed
```

When Internet returns:

```text
SQLite
   ↓
Sync Queue
   ↓
Laravel API
   ↓
Cloud DB
```

Resolve duplicate/conflict situations safely.

Do not silently overwrite user data.

---

# 42. Security

Financial data is private.

Requirements:

- HTTPS;
- secure authentication;
- user authorization;
- validation on backend;
- password hashing;
- secure token storage;
- no cross-user data access;
- no financial data in logs;
- no secrets in source code.

Future:

- biometric lock;
- PIN;
- encrypted local database if required.

---

# 43. API principles

Every API response should be predictable.

Example:

```json
{
  "data": {},
  "message": "Success"
}
```

Errors:

```json
{
  "message": "Validation failed",
  "errors": {}
}
```

Use proper HTTP status codes.

---

# 44. Currency

Default:

```text
XOF
```

Display format:

```text
50 000 F
```

Do not display:

```text
50,000.00 XOF
```

unless explicitly needed in technical/export contexts.

---

# 45. UX principles

The user must understand the financial situation in seconds.

Avoid:

- complicated tables;
- excessive forms;
- unnecessary popups;
- too many charts;
- technical terminology.

Prioritize:

- visual hierarchy;
- large numbers;
- quick actions;
- clear feedback;
- short flows.

Main objective:

> **Adding a transaction should take less than 5 seconds.**

---

# 46. Animations

Use subtle animations:

- card entrance;
- balance changes;
- progress bars;
- chart transitions;
- bottom-sheet transitions;
- button feedback;
- page transitions.

Do NOT overanimate.

Performance matters.

---

# 47. Reusable design components

Create reusable components:

```text
GlassCard
GlassButton
PrimaryButton
GlassBottomSheet
BalanceCard
StatCard
BudgetCard
TransactionTile
AccountCard
SavingsGoalCard
ProgressBar
CategoryIcon
MoneyInput
AppBottomNavigation
EmptyState
ErrorState
LoadingState
```

Avoid duplicated UI code.

---

# 48. Empty states

Every list must have a proper empty state.

Example:

> **Aucune dépense pour le moment**
>
> Commencez à enregistrer vos dépenses pour voir vos statistiques.

Button:

```text
Ajouter une dépense
```

---

# 49. Loading states

Use:

- skeleton loaders;
- subtle shimmer;
- placeholders.

Avoid blocking full-screen spinners for simple actions.

---

# 50. Error handling

Errors must be understandable.

Bad:

> Exception: SocketException

Good:

> Impossible de synchroniser vos données.
> Vérifiez votre connexion Internet.

Allow retry.

---

# 51. MVP

Build in this order.

## Phase 1 — Foundation

- Flutter project;
- Laravel project;
- SQLite;
- API structure;
- authentication;
- theme;
- navigation;
- design system.

## Phase 2 — Core finance

- accounts;
- categories;
- income;
- expenses;
- transactions;
- dashboard.

## Phase 3 — Budget

- monthly budgets;
- progress;
- daily recommendation;
- alerts.

## Phase 4 — Analytics

- statistics;
- charts;
- category analysis.

## Phase 5 — Savings

- savings goals;
- progress;
- contributions.

## Phase 6 — Sync

- local SQLite;
- API sync;
- offline queue;
- conflict handling.

## Phase 7 — Production

- Laravel Cloud;
- production DB;
- environment variables;
- HTTPS;
- release build.

---

# 52. V2

After MVP:

- « Puis-je me permettre ça ? »;
- recurring expenses;
- recurring income;
- smart notifications;
- advanced offline-first;
- CSV/PDF export;
- dark mode polish;
- biometric security;
- better analytics.

---

# 53. V3

Future:

- spending predictions;
- personalized recommendations;
- anomaly detection;
- subscription tracking;
- shared budgets;
- financial reports;
- optional AI assistant.

Do NOT build these before the MVP is stable.

---

# 54. Real-life example

User receives:

```text
50 000 F
```

Suggested allocation:

```text
Vie courante: 30 000 F
Épargne:       10 000 F
Réserve:       10 000 F
```

User spends:

```text
Essence: 5 000 F
```

The app updates:

```text
Vie courante:
25 000 F remaining

Épargne:
10 000 F

Réserve:
10 000 F
```

If 20 days remain:

```text
Daily recommendation:
1 250 F / day
```

---

# 55. Important product philosophy

The app must NOT shame users.

Avoid:

> « Tu dépenses trop. »

Prefer:

> « Tu dépenses 25 % plus rapidement que prévu. »

Tone:

- helpful;
- neutral;
- encouraging;
- intelligent;
- non-judgmental.

---

# 56. AI coding agent instructions

When using Claude Code / Codex:

### Step 1

Read this entire file before coding.

### Step 2

Inspect the existing repository.

### Step 3

Do not overwrite an existing project without understanding it.

### Step 4

Create an implementation plan.

### Step 5

Build incrementally.

### Step 6

After each major phase:

- run tests;
- run static analysis;
- fix errors;
- verify navigation;
- verify API contracts.

### Step 7

Do not implement future features prematurely.

### Step 8

Do not invent requirements not present in this document unless necessary for technical correctness.

---

# 57. First instruction to Claude Code

Use this prompt:

```text
Read MASTER_SPEC.md completely.

This file is the source of truth for the Finance App.

The reference image is only a visual reference. The application must be a complete multi-screen mobile application and must NOT be reduced to a single page.

Stack:
- Flutter
- Laravel API
- SQLite locally on Flutter
- SQLite locally for Laravel development
- PostgreSQL or MySQL in production
- Laravel Cloud for backend deployment

I want a production-quality architecture, but I want to move quickly.

Before coding:
1. Inspect the repository.
2. Inspect the existing Flutter/Laravel setup if present.
3. Identify what already exists.
4. Create a concise implementation plan.
5. Explain any architectural decisions that affect the specification.

Then implement the project phase by phase.

Do not build V2/V3 features before the MVP is complete.

Prioritize:
- beautiful purple Liquid Glass UI;
- complete multi-screen navigation;
- fast transaction entry;
- clean architecture;
- SQLite local persistence;
- Laravel REST API;
- future offline synchronization;
- maintainable code.
```

---

# 58. Definition of done

The MVP is considered complete when:

- authentication works;
- dashboard works;
- income works;
- expenses work;
- transactions work;
- categories work;
- accounts work;
- budgets work;
- statistics work;
- savings goals work;
- local SQLite persistence works;
- Laravel API works;
- API authentication works;
- errors are handled;
- loading states exist;
- empty states exist;
- UI is responsive;
- UI consistently uses the purple Liquid Glass design;
- navigation works across all screens;
- no major crashes remain.

---

# 59. Final rule

**Build a real application, not a mockup.**

The reference image defines the **visual quality and design language**.

This document defines the **product, screens, architecture, data, UX and development priorities**.

The final result should feel like a polished, modern personal finance product with a complete user journey from onboarding → authentication → dashboard → transactions → budgets → statistics → savings → settings.
