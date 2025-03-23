"use client";

import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Bar Chart Component
interface BarChartProps {
  data: Array<{ name: string; value: number }>;
  xAxis: string;
  yAxis: string;
  height?: number;
}

export function BarChart({ data, height = 400 }: BarChartProps) {
  const chartData = {
    labels: data.map((item) => item.name),
    datasets: [
      {
        label: "Count",
        data: data.map((item) => item.value),
        backgroundColor: "rgba(99, 102, 241, 0.5)",
        borderColor: "rgb(99, 102, 241)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ height: height }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

// Pie Chart Component
interface PieChartProps {
  data: Array<{ name: string; value: number }>;
  category: string;
  value: string;
  height?: number;
}

export function PieChart({
  data,
  height = 400,
}: PieChartProps) {
  // Generate colors based on the number of categories
  const generateColors = (count: number) => {
    const colors = [
      "rgba(255, 99, 132, 0.7)",
      "rgba(54, 162, 235, 0.7)",
      "rgba(255, 206, 86, 0.7)",
      "rgba(75, 192, 192, 0.7)",
      "rgba(153, 102, 255, 0.7)",
      "rgba(255, 159, 64, 0.7)",
      "rgba(199, 199, 199, 0.7)",
    ];

    // If we need more colors than we have, generate them
    if (count > colors.length) {
      for (let i = colors.length; i < count; i++) {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        colors.push(`rgba(${r}, ${g}, ${b}, 0.7)`);
      }
    }

    return colors.slice(0, count);
  };

  const chartData = {
    labels: data.map((item) => item.name),
    datasets: [
      {
        data: data.map((item) => item.value),
        backgroundColor: generateColors(data.length),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
      },
    },
  };

  return (
    <div style={{ height: height }}>
      <Pie data={chartData} options={options} />
    </div>
  );
}
