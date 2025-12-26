<template>
  <div class="legal-page">
    <header class="page-header">
      <button @click="router.back()" class="back-button" aria-label="Zurück">
        <ArrowLeft :size="24" color="#1E232C" />
      </button>
      <h1>AGB</h1>
    </header>

    <div class="content">
      <p class="intro">Allgemeine Geschäftsbedingungen (AGB) für die Nutzung der Syfte-App</p>

      <section>
        <h2>1. Geltungsbereich</h2>
        <p>
          Diese Allgemeinen Geschäftsbedingungen (AGB) regeln die Nutzung der Syfte-App. Mit der Registrierung akzeptierst du diese Bedingungen.
        </p>
      </section>

      <section>
        <h2>2. Vertragsgegenstand</h2>
        <p>
          Syfte ist eine kostenlose Web-App, die es Nutzern ermöglicht, Sparziele zu setzen, Fortschritte zu verfolgen und mit Freunden gemeinsam zu sparen. Die App dient ausschliesslich privaten, nicht-kommerziellen Zwecken.
        </p>
      </section>

      <section>
        <h2>3. Registrierung und Nutzerkonto</h2>
        <ul>
          <li>Die Registrierung ist kostenlos und erfordert die Angabe einer gültigen E-Mail-Adresse.</li>
          <li>Du bist verpflichtet, wahrheitsgemässe und vollständige Angaben zu machen.</li>
          <li>Dein Passwort ist geheim zu halten. Du bist für alle Aktivitäten unter deinem Account verantwortlich.</li>
          <li>Pro Person ist nur ein Account erlaubt.</li>
        </ul>
      </section>

      <section>
        <h2>4. Nutzungsrechte und Pflichten</h2>
        <p>Du verpflichtest dich:</p>
        <ul>
          <li>Die App nur für legale Zwecke zu nutzen</li>
          <li>Keine beleidigenden, diffamierenden oder rechtswidrigen Inhalte zu veröffentlichen</li>
          <li>Keine automatisierten Systeme (Bots, Crawler) zur Nutzung der App einzusetzen</li>
          <li>Die Rechte anderer Nutzer zu respektieren</li>
        </ul>
      </section>

      <section>
        <h2>5. Verfügbarkeit und Änderungen</h2>
        <p>
          Wir bemühen uns, die App verfügbar zu halten, können jedoch keine ununterbrochene Verfügbarkeit garantieren. Wartungsarbeiten können jederzeit durchgeführt werden. Wir behalten uns vor, Funktionen der App jederzeit zu ändern oder einzustellen.
        </p>
      </section>

      <section>
        <h2>6. Haftung</h2>
        <p>
          Die Nutzung der App erfolgt auf eigene Verantwortung. Wir übernehmen keine Haftung für:
        </p>
        <ul>
          <li>Datenverlust oder technische Störungen</li>
          <li>Schäden durch Nutzungsausfall</li>
          <li>Inhalte, die von anderen Nutzern erstellt wurden</li>
        </ul>
        <p>
          Diese Haftungsbeschränkung gilt nicht bei Vorsatz oder grober Fahrlässigkeit.
        </p>
      </section>

      <section>
        <h2>7. Kündigung</h2>
        <p>
          Du kannst deinen Account jederzeit in den Einstellungen deaktivieren. Wir behalten uns vor, Accounts bei Verstössen gegen diese AGB ohne Vorankündigung zu sperren oder zu löschen.
        </p>
      </section>

      <section>
        <h2>8. Datenschutz</h2>
        <p>
          Die Verarbeitung deiner personenbezogenen Daten erfolgt gemäss unserer 
          <NuxtLink to="/datenschutz">Datenschutzerklärung</NuxtLink>.
        </p>
      </section>

      <section>
        <h2>9. Änderungen der AGB</h2>
        <p>
          Wir behalten uns vor, diese AGB jederzeit zu ändern. Änderungen werden auf dieser Seite veröffentlicht. Die fortgesetzte Nutzung nach einer Änderung gilt als Zustimmung zu den neuen Bedingungen.
        </p>
      </section>

      <section>
        <h2>10. Anwendbares Recht und Gerichtsstand</h2>
        <p>
          Es gilt Schweizer Recht unter Ausschluss des UN-Kaufrechts (CISG).
        </p>
      </section>

      <section>
        <h2>11. Salvatorische Klausel</h2>
        <p>
          Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen hiervon unberührt.
        </p>
      </section>

      <p class="disclaimer">
        Stand: {{ new Date().toLocaleDateString('de-CH', { year: 'numeric', month: 'long' }) }}
      </p>
      
      <p class="disclaimer">
        <strong>Hinweis:</strong> Dies ist ein studentisches Projekt der Fachhochschule Graubünden. 
        Die App dient ausschliesslich Lernzwecken.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft } from 'lucide-vue-next'

const router = useRouter()

useHead({
  title: 'AGB - Syfte',
  meta: [{ name: 'robots', content: 'noindex' }]
})
</script>

<style scoped>
.legal-page {
  min-height: 100vh;
  background: #FFFFFF;
  padding: env(safe-area-inset-top, 20px) 20px env(safe-area-inset-bottom, 20px) 20px;
  font-family: 'Urbanist', sans-serif;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
}

.back-button {
  background: #F7F8F9;
  padding: 10px;
  border-radius: 12px;
  display: flex;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.back-button:hover {
  background: #E8ECF4;
}

h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1E232C;
  margin: 0;
}

h2 {
  font-size: 18px;
  font-weight: 700;
  color: #1E232C;
  margin: 20px 0 10px;
}

.content {
  line-height: 1.6;
  color: #4B5563;
  max-width: 640px;
}

.content p {
  margin: 8px 0;
}

.content a {
  color: #35C2C1;
  text-decoration: underline;
}

.intro {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 24px;
  color: #1E232C;
}

section {
  margin-bottom: 28px;
}

ul {
  padding-left: 20px;
  margin: 10px 0;
}

li {
  margin: 6px 0;
}

.disclaimer {
  margin-top: 20px;
  font-style: italic;
  font-size: 14px;
  border-top: 1px solid #EEE;
  padding-top: 20px;
  color: #6B7280;
}

.disclaimer:last-child {
  border-top: none;
  padding-top: 0;
  margin-top: 10px;
}
</style>
