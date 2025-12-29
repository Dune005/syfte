<template>
  <div class="savings-chart-container">
    <!-- Timeframe Tabs -->
    <div class="chart-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="['tab-button', { active: selectedTimeframe === tab.value }]"
        @click="selectTimeframe(tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="chart-loading">
      <div class="spinner"></div>
      <p>Lade Statistiken...</p>
    </div>

    <!-- Chart -->
    <div v-else class="chart-wrapper">
      <client-only>
        <apexchart
          v-if="series.length > 0 && series[0].data.length > 0"
          type="area"
          height="280"
          :options="chartOptions"
          :series="series"
        />
        <div v-else class="no-data">
          <div class="no-data-icon">📊</div>
          <p>Noch keine Spardaten vorhanden</p>
          <span class="no-data-hint">Starte mit deinem ersten Sparvorgang!</span>
        </div>
      </client-only>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

// Tabs configuration
const tabs = [
  { label: '7 Tage', value: '7days' },
  { label: '30 Tage', value: '30days' },
  { label: '12 Monate', value: '12months' }
]

const selectedTimeframe = ref('30days')
const isLoading = ref(true)
const analyticsData = ref<any>(null)

// Fetch data from API
const fetchData = async () => {
  isLoading.value = true
  try {
    const response = await $fetch('/api/analytics/savings', {
      params: {
        timeframe: selectedTimeframe.value
      }
    })
    
    if (response.success) {
      analyticsData.value = response.analytics
    }
  } catch (error) {
    console.error('Fehler beim Laden der Statistiken:', error)
  } finally {
    isLoading.value = false
  }
}

const selectTimeframe = (timeframe: string) => {
  selectedTimeframe.value = timeframe
}

// Watch for timeframe changes
watch(selectedTimeframe, () => {
  fetchData()
})

// Format number helper
const formatNumber = (num: number) => {
  return num.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Prepare chart labels
const chartLabels = computed(() => {
  if (!analyticsData.value?.timeSeries) return []
  
  return analyticsData.value.timeSeries.map((item: any) => {
    const date = new Date(item.date)
    if (selectedTimeframe.value === '12months') {
      return new Intl.DateTimeFormat('de-CH', { month: 'short' }).format(date)
    }
    return new Intl.DateTimeFormat('de-CH', { 
      day: '2-digit', 
      month: '2-digit' 
    }).format(date)
  })
})

// Tägliche Beträge (für Tooltip)
const dailyAmounts = computed(() => {
  if (!analyticsData.value?.timeSeries) return []
  return analyticsData.value.timeSeries.map((item: any) => item.amount || 0)
})

// Prepare cumulative/total amounts
const totalAmounts = computed(() => {
  if (!analyticsData.value?.timeSeries) return []
  
  let cumulative = 0
  return analyticsData.value.timeSeries.map((item: any) => {
    cumulative += (item.amount || 0)
    return cumulative
  })
})

// Datenreihen für ApexCharts - Nur Gesamtsumme als Area
const series = computed(() => {
  if (totalAmounts.value.length === 0) return []
  
  return [
    {
      name: 'Gespart',
      data: totalAmounts.value
    }
  ]
})

// Chart Konfiguration - Modernes Area Chart Design
const chartOptions = computed(() => ({
  chart: {
    type: 'area',
    toolbar: { show: false },
    zoom: { enabled: false },
    fontFamily: "'Urbanist', sans-serif",
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 800,
      animateGradually: {
        enabled: true,
        delay: 150
      },
      dynamicAnimation: {
        enabled: true,
        speed: 350
      }
    }
  },
  stroke: {
    width: 3,
    curve: 'smooth'
  },
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'light',
      type: 'vertical',
      shadeIntensity: 0.3,
      gradientToColors: ['#35C2C1'],
      inverseColors: false,
      opacityFrom: 0.6,
      opacityTo: 0.05,
      stops: [0, 95, 100]
    }
  },
  colors: ['#35C2C1'],
  dataLabels: { enabled: false },
  markers: {
    size: 0,
    strokeWidth: 0,
    hover: {
      size: 6,
      sizeOffset: 3
    }
  },
  xaxis: {
    type: 'category',
    categories: chartLabels.value,
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: {
      rotate: 0,
      hideOverlappingLabels: true,
      style: { 
        colors: '#9CA3AF', 
        fontSize: '11px',
        fontFamily: "'Urbanist', sans-serif"
      }
    },
    tooltip: { enabled: false }
  },
  yaxis: {
    min: 0,
    labels: {
      style: { 
        colors: '#9CA3AF', 
        fontSize: '11px',
        fontFamily: "'Urbanist', sans-serif"
      },
      formatter: (val: number) => {
        if (val >= 1000) {
          return `${(val / 1000).toFixed(1)}k`
        }
        return val.toFixed(0)
      }
    }
  },
  grid: {
    borderColor: '#F3F4F6',
    strokeDashArray: 4,
    padding: { 
      left: 10, 
      right: 10,
      top: 0,
      bottom: 0
    },
    xaxis: {
      lines: { show: false }
    },
    yaxis: {
      lines: { show: true }
    }
  },
  tooltip: {
    enabled: true,
    shared: false,
    theme: 'light',
    custom: function({ dataPointIndex }: { dataPointIndex: number }) {
      const total = totalAmounts.value[dataPointIndex] || 0
      const daily = dailyAmounts.value[dataPointIndex] || 0
      const label = chartLabels.value[dataPointIndex] || ''
      
      return `
        <div class="custom-tooltip">
          <div class="tooltip-date">${label}</div>
          <div class="tooltip-row">
            <span class="tooltip-label">Gesamtstand:</span>
            <span class="tooltip-value">CHF ${formatNumber(total)}</span>
          </div>
          ${daily > 0 ? `
          <div class="tooltip-row daily">
            <span class="tooltip-label">Heute gespart:</span>
            <span class="tooltip-value highlight">+CHF ${formatNumber(daily)}</span>
          </div>
          ` : ''}
        </div>
      `
    }
  },
  legend: {
    show: false
  },
  responsive: [
    {
      breakpoint: 480,
      options: {
        chart: {
          height: 240
        },
        xaxis: {
          labels: {
            rotate: -45,
            style: {
              fontSize: '10px'
            }
          }
        }
      }
    }
  ]
}))

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.savings-chart-container {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* Tabs */
.chart-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  padding: 4px;
  background: #F3F4F6;
  border-radius: 12px;
}

.tab-button {
  flex: 1;
  padding: 10px 16px;
  background: transparent;
  border: none;
  border-radius: 10px;
  font-family: 'Urbanist', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #6B7280;
  cursor: pointer;
  transition: all 0.25s ease;
}

.tab-button:hover {
  color: #35C2C1;
}

.tab-button.active {
  background: white;
  color: #35C2C1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* Loading State */
.chart-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #F3F4F6;
  border-top-color: #35C2C1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.chart-loading p {
  font-size: 14px;
  color: #6B7280;
  font-family: 'Urbanist', sans-serif;
}

/* Chart Wrapper */
.chart-wrapper {
  position: relative;
  min-height: 280px;
  width: 100%;
}

/* No Data State */
.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  gap: 8px;
}

.no-data-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.no-data p {
  font-size: 16px;
  font-weight: 600;
  color: #6B7280;
  font-family: 'Urbanist', sans-serif;
  margin: 0;
}

.no-data-hint {
  font-size: 13px;
  color: #9CA3AF;
  font-family: 'Urbanist', sans-serif;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .savings-chart-container {
    padding: 16px;
  }

  .tab-button {
    padding: 8px 12px;
    font-size: 13px;
  }
}

@media (max-width: 414px) {
  .savings-chart-container {
    padding: 14px;
  }

  .chart-tabs {
    gap: 4px;
    padding: 3px;
  }

  .tab-button {
    padding: 8px 8px;
    font-size: 12px;
  }
}
</style>

<!-- Global Tooltip Styles (nicht scoped, da ApexCharts den Tooltip außerhalb rendert) -->
<style>
.custom-tooltip {
  background: white;
  border-radius: 12px;
  padding: 12px 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border: 1px solid #F3F4F6;
  font-family: 'Urbanist', sans-serif;
  min-width: 160px;
}

.tooltip-date {
  font-size: 12px;
  font-weight: 600;
  color: #9CA3AF;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tooltip-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.tooltip-row.daily {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed #E5E7EB;
}

.tooltip-label {
  font-size: 13px;
  color: #6B7280;
}

.tooltip-value {
  font-size: 14px;
  font-weight: 700;
  color: #1E232C;
}

.tooltip-value.highlight {
  color: #35C2C1;
}
</style>
