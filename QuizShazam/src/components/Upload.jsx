import React, { useState } from "react";
import * as XLSX from "xlsx";
import "../assets/css/Upload.css";
import { useMutation } from "react-query";
import { uploadData } from "../func/apiCalls.service";
import { message } from "antd";


const UploadQuiz = () => {
  const [file, setFile] = useState(null);
  const [jsonData, setJsonData] = useState(null);
  const [error, setError] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();

  const { mutate, isLoading } = useMutation(async (values) => {
    return await uploadData(values);
  });
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (
      file &&
      (file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel")
    ) {
      setFile(file);
      setError(null);
    } else {
      setError("File must be an Excel sheet");
    }
  };

  const handleUpload = () => {
    if (!file) {
      setError("Please select a file");
      return;
    } else setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const workbook = XLSX.read(event.target.result, { type: "array" });
      let sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (!jsonData.length) {
        messageApi.open({
          content: "Excel sheet is empty",
          type: "error",
        });
        return;
      }
      // Create an object to store subjects with their questions
      let subjects = {};

      // Skip the header row and process each row
      jsonData.slice(1).forEach((row) => {
        const subject = row[0];
        const questionText = row[1];
        const options = row.slice(2, 6);
        const correctOptionIndex = row[6] - 1; // Convert to 0-based index

        // Map options to an array of objects with text and isCorrect fields
        const mappedOptions = options.map((option, i) => ({
          text: option,
          isCorrect: i === correctOptionIndex,
        }));

        // Check if the subject already exists in the object
        if (!subjects[subject]) {
          subjects[subject] = [];
        }

        // Add the question to the subject's array
        subjects[subject].push({
          questionText,
          options: mappedOptions,
        });
      });

      // Create an array to store the final JSON objects for each subject
      const finalJsonArray = Object.keys(subjects)
        .filter((subject) => {
          return subject !== "undefined";
        })
        .map((subject) => ({
          title: `${subject} Quiz`,
          description: `Test your knowledge on ${subject} with this fun quiz`,
          questions: subjects[subject],
          authorId: "AK",
        }));
      console.log("🚀 ~ finalJsonArray ~ finalJsonArray:", finalJsonArray);

      setJsonData(finalJsonArray);
    };

    reader.readAsArrayBuffer(file);
  };

  const handlePost = async () => {
    if (!jsonData) {
      setError("Please upload a file first");
      return;
    }
    mutate(jsonData, {
      onSuccess: (data) => {
        console.log(data);
      },
      onError: (error) => {
        if (error.response.status === 413) {
          messageApi.open({
            content: error.response.statusText,
            type: "error",
          });
        }
      },
    });
  };
  if (error) {
    messageApi.open({
      content: error,
      type: "warning",
    });
  }
  return (
    <div className="upload-container">
      {contextHolder}
      <h1>Upload Quiz</h1>
      <p>
        Upload an Excel sheet to create a new quiz. The sheet should have the
        following format: question, answer, options (comma-separated).
      </p>
      <div className="form-group">
        <label htmlFor="excelFile">Excel File</label>
        <input type="file" id="excelFile" onChange={handleFileChange} />
      </div>
      <div style={{ display: "flex", width: "max-content", gap: "10px" }}>
        <button className="btn" onClick={handleUpload} disabled={!file}>
          Upload
        </button>
        <button className="btn" onClick={handlePost}>
          {isLoading ? "loading..." : "post"}
        </button>
      </div>
    </div>
  );
};

export default UploadQuiz;
