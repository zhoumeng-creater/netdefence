import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import styled from 'styled-components';

// 注册 Chart.js 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ChartContainer = styled.div<{ height?: number }>`
  position: relative;
  height: ${props => props.height || 300}px;
  width: 100%;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(0, 212, 255, 0.1);
`;

interface BarChartProps {
  data: ChartData<'bar'>;
  options?: ChartOptions<'bar'>;
  height?: number;
  title?: string;
  showLegend?: boolean;
  horizontal?: boolean;
  stacked?: boolean;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  options,
  height = 300,
  title,
  showLegend = true,
  horizontal = false,
  stacked = false,
}) => {
  const defaultOptions: ChartOptions<'bar'> = {
    indexAxis: horizontal ? 'y' as const : 'x' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.85)',
          font: {
            size: 12,
          },
          padding: 20,
          usePointStyle: true,
        },
      },
      title: {
        display: !!title,
        text: title,
        color: '#00d4ff',
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(26, 35, 50, 0.95)',
        titleColor: '#00d4ff',
        bodyColor: 'rgba(255, 255, 255, 0.85)',
        borderColor: 'rgba(0, 212, 255, 0.3)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              const value = horizontal ? context.parsed.x : context.parsed.y;
              label += value.toLocaleString();
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        stacked,
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.65)',
          font: {
            size: 11,
          },
        },
      },
      y: {
        stacked,
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.65)',
          font: {
            size: 11,
          },
          callback: function(value) {
            return value.toLocaleString();
          },
        },
      },
    },
    elements: {
      bar: {
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      },
    },
  };

  // 为数据集添加默认颜色
  const enhancedData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || [
        'rgba(0, 212, 255, 0.6)',
        'rgba(255, 0, 128, 0.6)',
        'rgba(0, 255, 136, 0.6)',
        'rgba(255, 215, 0, 0.6)',
        'rgba(138, 43, 226, 0.6)',
      ][index % 5],
      borderColor: dataset.borderColor || [
        'rgba(0, 212, 255, 1)',
        'rgba(255, 0, 128, 1)',
        'rgba(0, 255, 136, 1)',
        'rgba(255, 215, 0, 1)',
        'rgba(138, 43, 226, 1)',
      ][index % 5],
    })),
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options?.plugins,
    },
    scales: {
      ...defaultOptions.scales,
      ...options?.scales,
    },
  };

  return (
    <ChartContainer height={height}>
      <Bar data={enhancedData} options={mergedOptions} />
    </ChartContainer>
  );
};

export default BarChart;