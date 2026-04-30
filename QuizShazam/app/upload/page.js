"use client";
import { useState } from "react";
import * as XLSX from "xlsx";
import { useMutation } from "@tanstack/react-query";
import { message } from "antd";
import Cookies from "js-cookie";
import { uploadData } from "@/lib/api";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [jsonData, setJsonData] = useState(null);
  const [error, setError] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  const { mutate, isPending: isLoading } = useMutation({
    mutationFn: uploadData
  });

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f && (f.type.includes("sheet") || f.type.includes("excel"))) {
      setFile(f); setError(null);
    } else {
      setError("File must be an Excel sheet");
    }
  };

  const handleUpload = () => {
    if (!file) { setError("Please select a file"); return; }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target.result, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (!rows.length) { messageApi.error("Excel sheet is empty"); return; }

      const subjects = {};
      rows.slice(1).forEach((row) => {
        const [subject, questionText, ...rest] = row;
        const options = rest.slice(0, 4);
        const correctIdx = rest[4] - 1;
        if (!subjects[subject]) subjects[subject] = [];
        subjects[subject].push({
          questionText,
          options: options.map((t, i) => ({ text: t, isCorrect: i === correctIdx })),
        });
      });

      setJsonData(
        Object.keys(subjects).filter((s) => s !== "undefined").map((s) => ({
          title: `${s} Quiz`,
          description: `Test your knowledge on ${s} with this fun quiz`,
          questions: subjects[s],
          authorId: "AK",
        }))
      );
    };
    reader.readAsArrayBuffer(file);
  };

  const handlePost = () => {
    if (!jsonData) { setError("Please upload a file first"); return; }
    const { token } = JSON.parse(Cookies.get("user") || "{}");
    mutate(
      { values: jsonData, token },
      {
        onSuccess: () => messageApi.success("Quiz uploaded successfully!"),
        onError: (err) => messageApi.error(err.response?.statusText || "Upload failed"),
      }
    );
  };

  if (error) messageApi.warning(error);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {contextHolder}
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Upload Quiz</h1>
      <p className="text-gray-500 text-sm mb-8">
        Upload an Excel sheet to create quizzes. Format: Subject | Question | Option1 | Option2 | Option3 | Option4 | CorrectOptionNumber
      </p>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Excel File</label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
          />
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleUpload}
            disabled={!file}
            className="px-6 py-2 rounded-lg border border-purple-300 text-purple-600 text-sm font-semibold hover:bg-purple-50 disabled:opacity-40 transition"
          >
            Parse
          </button>
          <button
            onClick={handlePost}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 text-white text-sm font-semibold hover:opacity-90 transition"
          >
            {isLoading ? "Uploading..." : "Post Quiz"}
          </button>
        </div>
        {jsonData && (
          <p className="text-green-600 text-sm">✓ Parsed {jsonData.length} quiz(zes) — click "Post Quiz" to save.</p>
        )}
      </div>
    </div>
  );
}
