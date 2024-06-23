import React, { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import "../css/Upload.css";

const UploadQuiz = () => {
  const [file, setFile] = useState(null);
  const [jsonData, setJsonData] = useState(null);
  const [error, setError] = useState(null);
  const [uploaded, setUploaded] = useState(false);
  const { VITE_REACT_API_URL } = import.meta.env;

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (
      file &&
      (file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel")
    ) {
      setFile(file);
      setError(false);
    } else {
      setError(true);
    }
  };

  const handleUpload = () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const workbook = XLSX.read(event.target.result, { type: "array" });
      const sheet = workbook.Sheets["Sheet1"];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const questions = jsonData.slice(1).map((row, index) => ({
        questionText: row[0],
        options: row.slice(1, -1).map((option, i) => ({
          text: option,
          isCorrect: i === row[5] - 1,
        })),
      }));

      const finalJson = {
        title: "General Knowledge Quiz",
        description: "Test your general knowledge with this fun quiz!",
        questions,
        authorId: "lkasjkdhajkshd",
      };
      setJsonData(finalJson);
      setUploaded(true);
    };
    reader.readAsArrayBuffer(file);
  };

  const handlePost = async () => {
    if (!jsonData) {
      setError("Please upload a file first");
      return;
    }
    try {
      await axios.post(`${VITE_REACT_API_URL}/create-quiz`, jsonData);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="upload-container">
      <h1>Upload Quiz</h1>
      <p>
        Upload an Excel sheet to create a new quiz. The sheet should have the
        following format: question, answer, options (comma-separated).
      </p>
      <div className="form-group">
        <label htmlFor="excelFile">Excel File</label>
        <input type="file" id="excelFile" onChange={handleFileChange} />
      </div>
      <button className="btn" onClick={handleUpload} disabled={!file}>
        Upload
      </button>
      {uploaded && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i> Quiz uploaded successfully!
          <p>
            Your quiz has been uploaded and is now available for students to
            take.
          </p>
          <button onClick={handlePost}>Post to API</button>
        </div>
      )}
      {error && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle"></i> There was an error
          uploading your quiz.
          <p>Please check the format of your Excel sheet and try again.</p>
        </div>
      )}
    </div>
  );
};

export default UploadQuiz;
