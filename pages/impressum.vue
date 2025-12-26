<template>
  <div class="legal-page">
    <header class="page-header">
      <button @click="router.back()" class="back-button" aria-label="Zurück">
        <ArrowLeft :size="24" color="#1E232C" />
      </button>
      <h1>Impressum</h1>
    </header>

    <div class="content">
      <section>
        <h2>Kontaktadresse</h2>
        <p>Adrian Janka & Claudio Riz</p>
        <p>Sommeraustrasse 32</p>
        <p>7000 Chur</p>
        <p>Schweiz</p>
        <p>E-Mail: <br>
          adrian.janka@stud.fhgr.ch<br>
          claudio.riz@stud.fhgr.ch
        </p>
      </section>

      <section>
        <h2>Haftungsausschluss</h2>
        <p>
          Der Autor übernimmt keinerlei Gewähr hinsichtlich der inhaltlichen Richtigkeit, Genauigkeit, Aktualität, Zuverlässigkeit und Vollständigkeit der Informationen. Haftungsansprüche gegen den Autor wegen Schäden materieller oder immaterieller Art, welche aus dem Zugriff oder der Nutzung bzw. Nichtnutzung der veröffentlichten Informationen, durch Missbrauch der Verbindung oder durch technische Störungen entstanden sind, werden ausgeschlossen.
        </p>
      </section>

      <p class="disclaimer">
        Dies ist ein studentisches Projekt der Fachhochschule Graubünden. 
        Die App dient ausschliesslich Lernzwecken und hat keinen kommerziellen Hintergrund.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft } from 'lucide-vue-next'

const router = useRouter()

useHead({
  title: 'Impressum - Syfte',
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

section {
  margin-bottom: 24px;
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
