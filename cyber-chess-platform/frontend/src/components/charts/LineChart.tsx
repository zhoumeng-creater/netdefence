import React, { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import styled from 'styled-components';

// 注册 Chart.js 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
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

interface LineChartProps {
  data: ChartData<'line'>;
  options?: ChartOptions<'line'>;
  height?: number;
  title?: string;
  showLegend?: boolean;
  enableGradient?: boolean;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  options,
  height = 300,
  title,
  showLegend = true,
  enableGradient = true,
}) => {
  const chartRef = useRef<ChartJS<'line'>>(null);

  useEffect(() => {
    const chart = chartRef.current;
    // 修复：先检查 chart 存在，再创建 gradient
    if (!chart || !enableGradient) return;

    // 创建渐变
    const ctx = chart.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(0, 212, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');

    // 应用渐变到数据集
    chart.data.datasets.forEach(dataset => {
      dataset.backgroundColor = gradient;
    });
    chart.update();
  }, [data, height, enableGradient]);

  const defaultOptions: ChartOptions<'line'> = {
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
          padding: 15,
          usePointStyle: true,
        },
      },
      title: {
        display: !!title,
        text: title,
        color: '#00d4ff',
        font: {
          size: 16,
          weight: 'bold' as const,
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
              label += context.parsed.y.toLocaleString();
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
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
            return Number(value).toLocaleString();
          },
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 2,
        borderColor: '#00d4ff',
      },
      point: {
        radius: 4,
        hitRadius: 10,
        hoverRadius: 6,
        backgroundColor: '#00d4ff',
        borderColor: '#fff',
        borderWidth: 2,
        hoverBorderWidth: 3,
      },
    },
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
      <Line ref={chartRef} data={data} options={mergedOptions} />
    </ChartContainer>
  );
};

export default LineChart;