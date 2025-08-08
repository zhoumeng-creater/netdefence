import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js';
import { Pie, Doughnut } from 'react-chartjs-2';
import styled from 'styled-components';

// 注册 Chart.js 组件
ChartJS.register(ArcElement, Tooltip, Legend);

const ChartContainer = styled.div<{ height?: number }>`
  position: relative;
  height: ${props => props.height || 300}px;
  width: 100%;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(0, 212, 255, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
`;

interface PieChartProps {
  data: ChartData<'pie' | 'doughnut'>;
  options?: ChartOptions<'pie' | 'doughnut'>;
  height?: number;
  title?: string;
  showLegend?: boolean;
  type?: 'pie' | 'doughnut';
}

const PieChart: React.FC<PieChartProps> = ({
  data,
  options,
  height = 300,
  title,
  showLegend = true,
  type = 'doughnut',
}) => {
  const defaultOptions: ChartOptions<'pie' | 'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'right' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.85)',
          font: {
            size: 12,
          },
          padding: 15,
          usePointStyle: true,
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels && data.labels.length && data.datasets.length) {
              const dataset = data.datasets[0];
              const total = (dataset.data as number[]).reduce((a, b) => a + b, 0);
              
              return data.labels.map((label, i) => {
                const value = dataset.data[i] as number;
                const percentage = ((value / total) * 100).toFixed(1);
                
                return {
                  text: `${label}: ${percentage}%`,
                  fillStyle: Array.isArray(dataset.backgroundColor) 
                    ? dataset.backgroundColor[i] 
                    : dataset.backgroundColor,
                  strokeStyle: Array.isArray(dataset.borderColor)
                    ? dataset.borderColor[i]
                    : dataset.borderColor,
                  lineWidth: dataset.borderWidth as number || 1,
                  hidden: false,
                  index: i,
                };
              });
            }
            return [];
          },
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
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: any) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderColor: 'rgba(15, 20, 25, 0.8)',
        hoverBorderWidth: 3,
        hoverBorderColor: '#00d4ff',
      },
    },
    animation: {
      animateRotate: true,
      animateScale: false,
    },
  };

  // 为数据集添加默认颜色
  const defaultColors = [
    'rgba(0, 212, 255, 0.8)',    // Cyan
    'rgba(255, 0, 128, 0.8)',     // Pink
    'rgba(0, 255, 136, 0.8)',     // Green
    'rgba(255, 215, 0, 0.8)',     // Gold
    'rgba(138, 43, 226, 0.8)',    // Purple
    'rgba(255, 99, 71, 0.8)',     // Tomato
    'rgba(30, 144, 255, 0.8)',    // Blue
    'rgba(255, 140, 0, 0.8)',     // Orange
    'rgba(147, 112, 219, 0.8)',   // Medium Purple
    'rgba(32, 178, 170, 0.8)',    // Light Sea Green
  ];

  const enhancedData = {
    ...data,
    datasets: data.datasets.map(dataset => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || defaultColors,
      borderColor: dataset.borderColor || 'rgba(15, 20, 25, 0.8)',
      borderWidth: dataset.borderWidth || 2,
    })),
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options?.plugins,
    },
  };

  const ChartComponent = type === 'pie' ? Pie : Doughnut;

  return (
    <ChartContainer height={height}>
      <ChartComponent data={enhancedData} options={mergedOptions} />
    </ChartContainer>
  );
};

export default PieChart;