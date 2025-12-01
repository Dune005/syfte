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
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

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

// Prepare chart data
const chartData = computed(() => {
  if (!analyticsData.value?.timeSeries) {
    return {
      labels: [],
      datasets: []
    }
  }

  const timeSeries = analyticsData.value.timeSeries
  
  // Generate all dates in range for consistent display
  const labels = timeSeries.map((item: any) => item.date)
  const dailyAmounts = timeSeries.map((item: any) => item.amount)
  
  // Calculate cumulative sum
  let cumulative = 0
  const cumulativeAmounts = dailyAmounts.map((amount: number) => {
    cumulative += amount
    return cumulative
  })

  return {
    labels,
    datasets: [
      {
        label: 'Tägliche Sparbeträge',
        data: dailyAmounts,
        borderColor: '#63b08e',
        backgroundColor: 'rgba(99, 176, 142, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        yAxisID: 'y'
      },
      {
        label: 'Gesamtsumme',
        data: cumulativeAmounts,
        borderColor: '#315549',
        backgroundColor: 'rgba(49, 85, 73, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        yAxisID: 'y1'
      }
    ]
  }
})

// Chart options
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false
  },
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      align: 'end' as const,
      labels: {
        boxWidth: 12,
        boxHeight: 12,
        padding: 10,
        font: {
          size: 12,
          family: "'Urbanist', sans-serif"
        },
        color: '#374151'
      }
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#1f2937',
      bodyColor: '#374151',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      padding: 12,
      boxPadding: 6,
      usePointStyle: true,
      callbacks: {
        label: function(context: any) {
          let label = context.dataset.label || ''
          if (label) {
            label += ': '
          }
          label += 'CHF ' + context.parsed.y.toFixed(2)
          return label
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: true,
        color: 'rgba(0, 0, 0, 0.05)'
      },
      ticks: {
        maxRotation: 45,
        minRotation: 45,
        font: {
          size: 11,
          family: "'Urbanist', sans-serif"
        },
        color: '#6B7280'
      }
    },
    y: {
      type: 'linear' as const,
      display: true,
      position: 'left' as const,
      title: {
        display: true,
        text: 'Täglicher Betrag (CHF)',
        font: {
          size: 12,
          family: "'Urbanist', sans-serif",
          weight: 600
        },
        color: '#63b08e'
      },
      grid: {
        display: true,
        color: 'rgba(0, 0, 0, 0.05)'
      },
      ticks: {
        font: {
          size: 11,
          family: "'Urbanist', sans-serif"
        },
        color: '#6B7280',
        callback: function(value: any) {
          return 'CHF ' + value
        }
      }
    },
    y1: {
      type: 'linear' as const,
      display: true,
      position: 'right' as const,
      title: {
        display: true,
        text: 'Gesamtsumme (CHF)',
        font: {
          size: 12,
          family: "'Urbanist', sans-serif",
          weight: 600
        },
        color: '#315549'
      },
      grid: {
        drawOnChartArea: false
      },
      ticks: {
        font: {
          size: 11,
          family: "'Urbanist', sans-serif"
        },
        color: '#6B7280',
        callback: function(value: any) {
          return 'CHF ' + value
        }
      }
    }
  }
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* Tabs */
.chart-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 2px solid #F3F4F6;
  padding-bottom: 12px;
}

.tab-button {
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-family: 'Urbanist', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #6B7280;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
}

.tab-button:hover {
  background: #F3F4F6;
  color: #315549;
}

.tab-button.active {
  background: #315549;
  color: white;
}

/* Loading State */
.chart-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
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
}

/* Chart Wrapper */
.chart-wrapper {
  position: relative;
  height: 350px;
  width: 100%;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .savings-chart-container {
    padding: 16px;
  }

  .chart-wrapper {
    height: 300px;
  }

  .tab-button {
    padding: 6px 12px;
    font-size: 13px;
  }
}

@media (max-width: 414px) {
  .chart-wrapper {
    height: 280px;
  }

  .tab-button {
    padding: 6px 10px;
    font-size: 12px;
  }
}
</style>
