<template>
  <div class="legal-page">
    <header class="page-header">
      <button @click="router.back()" class="back-button" aria-label="Zurück">
        <ArrowLeft :size="24" color="#1E232C" />
      </button>
      <h1>Datenschutz</h1>
    </header>

    <div class="content">

      <section>
        <h2>Erhebung und Bearbeitung von Personendaten</h2>
        <p>
          Wir bearbeiten primär die Personendaten, die wir im Rahmen unserer App von unseren Nutzern erhalten. Dies umfasst:
        </p>
        <ul>
          <li>Registrierungsdaten (Name, E-Mail, Benutzername)</li>
          <li>Nutzungsdaten (Sparziele, Transaktionen, Achievements)</li>
          <li>Technische Daten (IP-Adresse, Cookies für Login-Sessions)</li>
          <li>Push-Benachrichtigungen (falls aktiviert)</li>
        </ul>
      </section>

      <section>
        <h2>Zweck der Datenbearbeitung</h2>
        <p>
          Die Daten dienen ausschliesslich dem Betrieb der Spar-App Syfte, der Verwaltung der Nutzerkonten und der Bereitstellung der Kernfunktionen (Tracking von Sparzielen, Streak-System, Achievements).
        </p>
      </section>

      <section>
        <h2>Datenspeicherung</h2>
        <p>
          Deine Daten werden in einer MariaDB-Datenbank gespeichert. Wir bewahren deine Daten nur so lange auf, wie es für den Betrieb der App notwendig ist oder bis du dein Konto löschst.
        </p>
      </section>

      <section>
        <h2>Weitergabe von Daten</h2>
        <p>
          Wir geben deine Daten nicht an Dritte weiter, ausser:
        </p>
        <ul>
          <li>Du hast deine ausdrückliche Einwilligung gegeben</li>
          <li>Es besteht eine gesetzliche Verpflichtung dazu</li>
        </ul>
        <p>
          Falls du Google OAuth zur Anmeldung nutzt, verarbeitet Google bestimmte Daten gemäss deren Datenschutzrichtlinien.
        </p>
      </section>

      <section>
        <h2>Cookies und Sessions</h2>
        <p>
          Wir verwenden Session-Cookies, um dich eingeloggt zu halten. Diese Cookies sind technisch notwendig und enthalten keine persönlichen Informationen ausser deiner Benutzer-ID.
        </p>
      </section>

      <section>
        <h2>Deine Rechte</h2>
        <p>
          Du hast im Rahmen des auf dich anwendbaren Datenschutzrechts das Recht auf:
        </p>
        <ul>
          <li>Auskunft über deine gespeicherten Daten</li>
          <li>Berichtigung unrichtiger Daten</li>
          <li>Löschung deiner Daten (Account-Deaktivierung)</li>
          <li>Einschränkung der Datenbearbeitung</li>
          <li>Datenübertragbarkeit (CSV/PDF-Export)</li>
        </ul>
        <p>
          Du kannst diese Rechte über die Einstellungen in der App oder per E-Mail an [Deine E-Mail] ausüben.
        </p>
      </section>

      <section>
        <h2>Datensicherheit</h2>
        <p>
          Wir setzen technische und organisatorische Sicherheitsmassnahmen ein, um deine Daten vor unberechtigtem Zugriff, Verlust oder Missbrauch zu schützen:
        </p>
        <ul>
          <li>Passwort-Hashing mit PBKDF2</li>
          <li>HTTPS-Verschlüsselung für alle Datenübertragungen</li>
          <li>Security Headers (CSP, HSTS, X-Frame-Options)</li>
          <li>Rate Limiting gegen Brute-Force-Angriffe</li>
        </ul>
      </section>

      <section>
        <h2>Änderungen dieser Datenschutzerklärung</h2>
        <p>
          Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen, um aktuellen rechtlichen Anforderungen zu entsprechen oder Änderungen unserer App abzubilden.
        </p>
      </section>

      <p class="disclaimer">
        Stand: {{ new Date().toLocaleDateString('de-CH', { year: 'numeric', month: 'long' }) }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft } from 'lucide-vue-next'

const router = useRouter()

useHead({
  title: 'Datenschutz - Syfte',
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

.intro {
  font-size: 15px;
  margin-bottom: 24px;
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
  margin-top: 40px;
  font-style: italic;
  font-size: 14px;
  border-top: 1px solid #EEE;
  padding-top: 20px;
  color: #6B7280;
}
</style>
