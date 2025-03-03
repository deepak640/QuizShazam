import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

// Register the required components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BarChart = () => {
  // Sample quiz data (you'll replace this with actual data from your Profile component)
  const quizData = [
    {
      "_id": "66af6a689118a99ac983323f",
      "score": 2,
      "title": "History Quiz"
    },
    // Add more quiz objects as needed for testing
    {
      "_id": "66af6a689118a99ac9833240",
      "score": 5,
      "title": "Science Quiz"
    },
    {
      "_id": "66af6a689118a99ac9833241",
      "score": 8,
      "title": "Math Quiz"
    }
  ];

  const chartData = {
    labels: quizData.map(quiz => quiz.title.slice(0, 10) + "..."), // Truncate long titles
    datasets: [
      {
        label: "Quiz Scores",
        data: quizData.map(quiz => quiz.score || 0), // Use raw scores
        backgroundColor: quizData.map(quiz => {
          // Dynamic colors based on score (optional enhancement)
          if (quiz.score >= 7) return "rgba(46, 204, 113, 0.6)"; // Green for high scores
          if (quiz.score >= 4) return "rgba(52, 152, 219, 0.6)"; // Blue for medium
          return "rgba(231, 76, 60, 0.6)"; // Red for low scores
        }),
        borderColor: quizData.map(quiz => {
          if (quiz.score >= 7) return "rgba(46, 204, 113, 1)";
          if (quiz.score >= 4) return "rgba(52, 152, 219, 1)";
          return "rgba(231, 76, 60, 1)";
        }),
        borderWidth: 1,
        borderRadius: 2,
        barThickness: 60,
        hoverBackgroundColor: quizData.map(quiz => {
          if (quiz.score >= 7) return "rgba(46, 204, 113, 0.8)";
          if (quiz.score >= 4) return "rgba(52, 152, 219, 0.8)";
          return "rgba(231, 76, 60, 0.8)";
        }),
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            size: 14,
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          },
          color: "#2c3e50",
        },
      },
      title: {
        display: true,
        text: "Your Quiz Performance",
        font: {
          size: 20,
          weight: "bold",
          family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
        },
        color: "#2c3e50",
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const quiz = quizData[context.dataIndex];
            return `${quiz.title}: ${context.raw} points`;
          },
        },
        backgroundColor: "rgba(44, 62, 80, 0.9)",
        titleFont: { size: 14 },
        bodyFont: { size: 12 },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
          },
          color: "#7f8c8d",
          maxRotation: 45,
          minRotation: 45, // Slight rotation for better readability
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(127, 140, 141, 0.2)",
        },
        ticks: {
          font: {
            size: 12,
          },
          color: "#7f8c8d",
          stepSize: 1, // Since scores are likely small integers
        },
      },
    },
    animation: {
      duration: 1200,
      easing: "easeOutBounce", // Fun bounce effect
    },
  };

  return (
    <div style={{ height: "400px", width: "100%" }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default BarChart;
