<template>
  <div class="info-page">
    <!-- Header mit Zurück-Button -->
    <header class="header">
      <NuxtLink to="/" class="back-button" aria-label="Zurück">
        <ArrowLeft :size="24" color="#FFFFFF" />
      </NuxtLink>
      <h1>Wie funktioniert syfte?</h1>
    </header>

    <!-- Scrollbarer Content -->
    <div class="content">
      <!-- Hero Section -->
      <section class="hero">
        <img src="/images/syfte_Logo/Logo_syfte.png" alt="Syfte Logo" class="hero-logo" />
        <p class="hero-text">
          Sparen war noch nie so einfach und motivierend!
        </p>
      </section>

      <!-- Step 1: Sparziel setzen -->
      <section class="step">
        <div class="step-number">1</div>
        <div class="step-content">
          <h2>Setze dein Sparziel</h2>
          <p>
            Definiere ein persönliches Ziel – egal ob neues Handy, Traumurlaub oder Notgroschen. 
            Lege den Betrag fest und behalte deinen Fortschritt immer im Blick.
          </p>
        </div>
      </section>

      <!-- Step 2: Sparaktionen -->
      <section class="step">
        <div class="step-number">2</div>
        <div class="step-content">
          <h2>Wähle deine Sparaktionen</h2>
          <p>
            Hast du heute den Kaffee to-go ausgelassen? Das Mittagessen selbst gekocht? 
            Erstelle dir eigene Sparaktionen – und tracke, 
            wie viel du dadurch sparst.
          </p>
        </div>
      </section>

      <!-- Step 3: Fortschritt verfolgen -->
      <section class="step">
        <div class="step-number">3</div>
        <div class="step-content">
          <h2>Verfolge deinen Fortschritt</h2>
          <p>
            Schau dir im Dashboard an, wie nah du deinem Ziel schon bist. 
            Der Fortschrittsbalken zeigt dir genau, wie weit du gekommen bist.
          </p>
        </div>
      </section>

      <!-- Step 4: Streaks & Achievements -->
      <section class="step">
        <div class="step-number">4</div>
        <div class="step-content">
          <h2>Sammle Streaks & Achievements</h2>
          <p>
            Bleib dran! Für jeden Tag, an dem du sparst, baust du deinen Streak aus. 
            Schalte coole Achievements frei und lass dich von unserem syfte-Schaf anfeuern! 🐑
          </p>
        </div>
      </section>

      <!-- Step 5: Gemeinsam sparen -->
      <section class="step">
        <div class="step-number">5</div>
        <div class="step-content">
          <h2>Spare mit Freunden</h2>
          <p>
            Teile Sparziele mit Freunden und motiviert euch gegenseitig. 
            Zusammen sparen macht mehr Spass und ihr erreicht eure Ziele schneller!
          </p>
        </div>
      </section>

      <!-- Features Liste -->
      <section class="features">
        <h2>Das bietet dir syfte:</h2>
        <ul class="feature-list">
          <li>
            <Target :size="20" color="#35C2C1" />
            <span>Unbegrenzte Sparziele</span>
          </li>
          <li>
            <Sparkles :size="20" color="#35C2C1" />
            <span>Eigene Sparaktionen erstellen</span>
          </li>
          <li>
            <Flame :size="20" color="#35C2C1" />
            <span>Streak-System für tägliche Motivation</span>
          </li>
          <li>
            <Trophy :size="20" color="#35C2C1" />
            <span>Achievements zum Freischalten</span>
          </li>
          <li>
            <Users :size="20" color="#35C2C1" />
            <span>Gemeinsame Sparziele mit Freunden</span>
          </li>
          <li>
            <Bell :size="20" color="#35C2C1" />
            <span>Push-Benachrichtigungen</span>
          </li>
          <li>
            <Download :size="20" color="#35C2C1" />
            <span>Datenexport (CSV/JSON)</span>
          </li>
        </ul>
      </section>


      <!-- CTA -->
      <section class="cta">
        <h2>Bereit zum Sparen?</h2>
        <div class="cta-buttons">
          <ButtonPrimary to="/register">Jetzt registrieren</ButtonPrimary>
          <ButtonSecondary to="/login">Bereits registriert? Login</ButtonSecondary>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft, ImageIcon, Target, Sparkles, Flame, Trophy, Users, Bell, Download } from 'lucide-vue-next'

useHead({
  title: 'Wie funktioniert syfte? - Syfte',
  meta: [
    { name: 'description', content: 'Erfahre, wie du mit Syfte einfach und motivierend sparen kannst.' }
  ]
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:global(html),
:global(body) {
  background: linear-gradient(180deg, #315549 0%, #63b08e 100%);
  background-attachment: fixed;
  min-height: 100vh;
}

.info-page {
  min-height: 100vh;
  background: transparent;
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* Header */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  padding: 16px;
  padding-top: calc(16px + env(safe-area-inset-top, 0px));
  background: rgba(49, 85, 73, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin-right: 12px;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.25);
}

.back-button:active {
  transform: scale(0.95);
  background: rgba(255, 255, 255, 0.3);
}

.header h1 {
  font-family: 'Lato', sans-serif;
  font-weight: 700;
  font-size: 18px;
  color: #FFFFFF;
  flex: 1;
}

/* Content Container */
.content {
  max-width: 414px;
  margin: 0 auto;
  padding: 0 16px 32px;
}

/* Hero Section */
.hero {
  text-align: center;
  padding: 32px 0;
}

.hero-logo {
  width: 100px;
  height: auto;
  margin-bottom: 16px;
}

.hero-text {
  font-family: 'Urbanist', sans-serif;
  font-weight: 600;
  font-size: 18px;
  color: #FFFFFF;
  line-height: 1.5;
}

/* Step Sections */
.step {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  animation: fadeInUp 0.5s ease-out forwards;
}

.step-number {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: #35C2C1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Lato', sans-serif;
  font-weight: 900;
  font-size: 20px;
  color: #FFFFFF;
}

.step-content {
  flex: 1;
}

.step-content h2 {
  font-family: 'Lato', sans-serif;
  font-weight: 700;
  font-size: 18px;
  color: #FFFFFF;
  margin-bottom: 8px;
}

.step-content p {
  font-family: 'Urbanist', sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  margin-bottom: 16px;
}

/* Placeholder Image */
.placeholder-image {
  background: rgba(255, 255, 255, 0.1);
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.placeholder-image span {
  font-family: 'Urbanist', sans-serif;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

/* Step Image (echte Bilder) */
.step-image {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.step-image img {
  max-width: 100%;
  height: auto;
  max-height: 200px;
  object-fit: contain;
}

/* Features Section */
.features {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 32px;
}

.features h2 {
  font-family: 'Lato', sans-serif;
  font-weight: 700;
  font-size: 18px;
  color: #FFFFFF;
  margin-bottom: 16px;
}

.feature-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: 'Urbanist', sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: #FFFFFF;
}

/* Banner Section */
.banner-section {
  width: 100%;
  margin: 24px 0 32px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.banner-image {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}

/* CTA Section */
.cta {
  text-align: center;
  padding: 24px 0;
}

.cta h2 {
  font-family: 'Lato', sans-serif;
  font-weight: 700;
  font-size: 22px;
  color: #FFFFFF;
  margin-bottom: 24px;
}

.cta-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Animation delays for steps */
.step:nth-child(2) { animation-delay: 0.1s; }
.step:nth-child(3) { animation-delay: 0.2s; }
.step:nth-child(4) { animation-delay: 0.3s; }
.step:nth-child(5) { animation-delay: 0.4s; }
.step:nth-child(6) { animation-delay: 0.5s; }

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .step {
    animation: none;
    opacity: 1;
  }
}

/* Responsive adjustments */
@media (max-width: 360px) {
  .step-number {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }
  
  .step-content h2 {
    font-size: 16px;
  }
  
  .hero-text {
    font-size: 16px;
  }
}

@media (min-width: 768px) {
  .content {
    max-width: 600px;
    padding: 0 32px 48px;
  }
  
  .hero {
    padding: 48px 0;
  }
  
  .hero-logo {
    width: 140px;
  }
  
  .hero-text {
    font-size: 22px;
  }
  
  .step-content h2 {
    font-size: 20px;
  }
  
  .step-content p {
    font-size: 16px;
  }
}
</style>
