Das ist ein klassisches Problem bei Finanz-Apps auf mobilen Geräten: Du versuchst, **diskrete Werte** (tägliche Einzahlung, schwankt stark) und **kumulative Werte** (Gesamtsumme, steigt stetig) im selben Diagramm mit zwei verschiedenen Y-Achsen darzustellen. Das führt visuell zu Chaos.

Hier ist mein Plan, um das für dein Nuxt-Projekt zu modernisieren und aufzuräumen.

---

## 1. Analyse & UX-Konzept

### Das Problem im aktuellen Chart:
1.  **Doppelte Y-Achse:** Links "Täglich", Rechts "Gesamt". Das ist auf kleinen Screens kognitiv schwer zu verarbeiten.
2.  **X-Achsen-Labels:** Die Datumsangaben (`2025-12-02`) sind zu lang und um 45° gedreht -> schwer lesbar.
3.  **Visuelles Rauschen:** Zu viele Gitterlinien und Punkte auf den Linien.

### Der Lösungsvorschlag (Modern Mobile UI):
Anstatt Linien für beides zu verwenden, nutzen wir eine **Kombination (Combo-Chart)** oder trennen die visuelle Sprache:
*   **Gesamtsumme:** Ein **Area-Chart (Flächendiagramm)** mit einem Farbverlauf. Das suggeriert "Volumen" und Wachstum.
*   **Tägliche Sparbeträge:** Ein **Bar-Chart (Balkendiagramm)** im Hintergrund oder als Overlay. Balken eignen sich besser für einzelne Transaktionen als Linien.
*   **Achsen:** Wir blenden die Gitterlinien weitgehend aus und kürzen das Datum (z.B. "02. Dez").
*   **Tooltips:** Details zeigen wir erst beim Tippen (Touch) an, um den Screen sauber zu halten.

---

## 2. Plan

1.  **Bibliothek wählen:** Wir nutzen **Chart.js** mit `vue-chartjs`. Das ist der Standard für Nuxt, leichtgewichtig und sehr gut anpassbar.
2.  **Komponente erstellen:** Eine wiederverwendbare `SavingsChart.vue` Komponente.
3.  **Konfiguration:** Einrichten eines "Mixed Charts" (Line + Bar) mit modernem Styling (Gradient, Rounded Corners).
4.  **Datenformatierung:** Optimierung der Achsenbeschriftung für Mobile.

---

## 3. Implementation in Nuxt

Zuerst installieren wir die notwendigen Pakete:

```bash
npm install chart.js vue-chartjs
```

### Die Chart-Komponente

Erstelle eine Datei `components/SavingsChart.vue`. Wir nutzen hier die Composition API (`<script setup>`).

```vue
<template>
  <div class="chart-container">
    <!-- Chart Wrapper für Responsivität -->
    <div class="canvas-wrapper">
      <Line :data="chartData" :options="chartOptions" ref="chartRef" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement, // Wichtig für Mixed Charts
  BarController, // Wichtig für Mixed Charts
  Title,
  Tooltip,
  Legend,
  Filler, // Für den Area-Effect (Verlauf unter der Linie)
  ScriptableContext
} from 'chart.js';
import { Line } from 'vue-chartjs';

// 1. Registriere die Module
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Props für Daten (Beispielhaft)
const props = defineProps<{
  dates: string[];
  dailyAmounts: number[];
  totalAmounts: number[];
}>();

// 2. Erstelle den Gradienten (Modern Look)
const getGradient = (ctx: ScriptableContext<'line'>) => {
  const canvas = ctx.chart.ctx;
  const gradient = canvas.createLinearGradient(0, 0, 0, 400);
  // Farbe: Smaragdgrün transparent bis fast unsichtbar
  gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)'); 
  gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
  return gradient;
};

// 3. Daten Konfiguration
const chartData = computed(() => ({
  labels: props.dates, // Hier sollten bereits kurze Daten stehen (z.B. "02.12")
  datasets: [
    {
      // Dataset 1: Gesamtsumme (Die wichtige Kurve)
      type: 'line' as const,
      label: 'Gesamtsumme',
      data: props.totalAmounts,
      borderColor: '#10B981', // Emerald 500
      backgroundColor: getGradient, // Gradient unter der Linie
      fill: true,
      tension: 0.4, // Macht die Linie schön kurvig (smooth)
      pointRadius: 0, // Punkte standardmäßig ausblenden (cleaner Look)
      pointHitRadius: 20, // Erleichtert das Antippen auf Mobile
      pointHoverRadius: 6,
      yAxisID: 'yTotal',
      order: 1, // Liegt VOR den Balken
    },
    {
      // Dataset 2: Tägliche Beträge (Als Balken im Hintergrund)
      type: 'bar' as const,
      label: 'Täglich',
      data: props.dailyAmounts,
      backgroundColor: 'rgba(52, 211, 153, 0.3)', // Emerald 400, transparent
      borderRadius: 4,
      barThickness: 8, // Schlanke Balken
      yAxisID: 'yDaily',
      order: 2, // Liegt HINTER der Linie
    },
  ],
}));

// 4. Optionen für minimalistisches Design
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false, // Wichtig für CSS-Höhensteuerung
  interaction: {
    mode: 'index', // Zeigt beide Werte an, wenn man die X-Achse berührt
    intersect: false,
  },
  plugins: {
    legend: {
      display: false, // Legend blenden wir oft aus oder bauen sie selbst in HTML
    },
    tooltip: {
      backgroundColor: '#1F2937',
      titleColor: '#F3F4F6',
      bodyColor: '#F3F4F6',
      padding: 10,
      cornerRadius: 8,
      displayColors: true,
    },
  },
  scales: {
    x: {
      grid: {
        display: false, // Keine vertikalen Gitterlinien
        drawBorder: false,
      },
      ticks: {
        maxRotation: 0, // Text nicht drehen!
        autoSkip: true, // Überspringe Labels bei Platzmangel
        maxTicksLimit: 5, // Nur max 5 Datumsangaben anzeigen
        color: '#9CA3AF',
        font: { size: 11 },
      },
    },
    yTotal: {
      type: 'linear' as const,
      display: true,
      position: 'right' as const,
      grid: {
        color: '#F3F4F6', // Sehr dezente horizontale Linien
        borderDash: [5, 5],
      },
      ticks: {
        color: '#10B981', // Farbe passend zur Linie
        callback: (value: number) => `CHF ${value}`, // Formatierung
        maxTicksLimit: 5,
      },
    },
    yDaily: {
      type: 'linear' as const,
      display: false, // Wir verstecken die Achse für die Balken! (Cleaner)
      position: 'left' as const,
      grid: { display: false },
      min: 0,
      // Trick: Max-Wert künstlich erhöhen, damit die Balken 
      // nur im unteren Drittel bleiben und nicht die Linie stören
      suggestedMax: Math.max(...props.dailyAmounts) * 3, 
    },
  },
};
</script>

<style scoped>
.chart-container {
  background: #ffffff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  width: 100%;
}

.canvas-wrapper {
  position: relative;
  height: 300px; /* Feste Höhe für Mobile */
  width: 100%;
}
</style>
```

---

## 4. Nutzung in deiner Page (Parent)

Hier simulieren wir kurz, wie du die Komponente einbindest und die Daten aufbereitest.

```vue
<template>
  <div class="app-container">
    <h2 class="title">Sparverlauf</h2>
    
    <!-- Deine Zeit-Tabs (Beibehalten, die sahen gut aus) -->
    <div class="tabs">
      <button class="active">30 Tage</button>
      <!-- ... -->
    </div>

    <!-- Das neue Chart -->
    <SavingsChart 
      :dates="formattedDates" 
      :daily-amounts="dailyData" 
      :total-amounts="totalData" 
    />
  </div>
</template>

<script setup>
// Beispiel-Daten
const rawDates = ['2025-12-02', '2025-12-04', '2025-12-08', '2025-12-15', '2025-12-29'];
const dailyData = [10, 50, 15, 120, 20]; // Stark schwankend
const totalData = [10, 60, 75, 195, 215]; // Steigend

// Hilfsfunktion: Datum formatieren (z.B. mit date-fns oder nativem JS)
// Macht aus "2025-12-02" -> "02.12."
const formattedDates = rawDates.map(d => {
  const date = new Date(d);
  return new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit' }).format(date);
});
</script>
```

---

## Warum ist diese Lösung besser?

1.  **Visuelle Hierarchie:**
    *   Die **Gesamtsumme** ist das Wichtigste -> Sie bekommt die markante Linie mit Farbverlauf.
    *   Die **täglichen Beträge** sind sekundär -> Sie werden als dezente Balken im unteren Bereich dargestellt.
2.  **Achsen-Trickserei (`suggestedMax`):**
    *   In der `chartOptions` bei `yDaily` habe ich `suggestedMax: Math.max(...) * 3` gesetzt.
    *   **Der Effekt:** Die Balken nutzen nur das untere Drittel des Charts. Die Linie schwebt darüber. Dadurch überlagern sie sich nicht chaotisch, obwohl sie im selben Chart sind.
3.  **Clean Up:**
    *   Die X-Achse zeigt nur noch wenige Labels (`maxTicksLimit: 5`) und rotiert diese nicht mehr.
    *   Die linke Y-Achse (für Daily) ist ausgeblendet. Man sieht den genauen Wert, wenn man darauf tippt (Tooltip), muss ihn aber nicht ständig an der Achse ablesen.

### Alternative Idee (Wenn es noch simpler sein soll)
Wenn dir die Balken im Hintergrund immer noch zu viel sind:
Lass die Balken im Chart komplett weg. Zeige im Chart **nur** die Gesamtsumme (Area Chart) an. Wenn der User den Tab "Tägliche Beträge" oben auswählt, tausche das *gesamte* Chart gegen ein reines Balkendiagramm aus. **Ein Chart pro Metrik** ist auf Mobile oft die sauberste Lösung.