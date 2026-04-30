"use client";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function BarChart({ userStats }) {
  const color = (score) => {
    if (score >= 7) return { bg: "rgba(46,204,113,0.6)", border: "rgba(46,204,113,1)", hover: "rgba(46,204,113,0.8)" };
    if (score >= 4) return { bg: "rgba(52,152,219,0.6)", border: "rgba(52,152,219,1)", hover: "rgba(52,152,219,0.8)" };
    return { bg: "rgba(231,76,60,0.6)", border: "rgba(231,76,60,1)", hover: "rgba(231,76,60,0.8)" };
  };

  const chartData = {
    labels: userStats.map((q) => q.title.slice(0, 10) + "..."),
    datasets: [{
      label: "Quiz Scores",
      data: userStats.map((q) => q.score || 0),
      backgroundColor: userStats.map((q) => color(q.score).bg),
      borderColor: userStats.map((q) => color(q.score).border),
      hoverBackgroundColor: userStats.map((q) => color(q.score).hover),
      borderWidth: 1,
      borderRadius: 2,
      barThickness: 60,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Your Quiz Performance", font: { size: 20, weight: "bold" } },
      tooltip: {
        callbacks: { label: (ctx) => `${userStats[ctx.dataIndex].title}: ${ctx.raw} points` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 45 } },
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
    animation: { duration: 1200, easing: "easeOutBounce" },
  };

  return (
    <div style={{ height: 400, width: "100%" }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
